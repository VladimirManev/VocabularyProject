(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory(
        require("http"),
        require("fs"),
        require("crypto")
      ))
    : typeof define === "function" && define.amd
    ? define(["http", "fs", "crypto"], factory)
    : ((global =
        typeof globalThis !== "undefined" ? globalThis : global || self),
      (global.Server = factory(global.http, global.fs, global.crypto)));
})(this, function (http, fs, crypto) {
  "use strict";

  function _interopDefaultLegacy(e) {
    return e && typeof e === "object" && "default" in e ? e : { default: e };
  }

  var http__default = /*#__PURE__*/ _interopDefaultLegacy(http);
  var fs__default = /*#__PURE__*/ _interopDefaultLegacy(fs);
  var crypto__default = /*#__PURE__*/ _interopDefaultLegacy(crypto);

  class ServiceError extends Error {
    constructor(message = "Service Error") {
      super(message);
      this.name = "ServiceError";
    }
  }

  class NotFoundError extends ServiceError {
    constructor(message = "Resource not found") {
      super(message);
      this.name = "NotFoundError";
      this.status = 404;
    }
  }

  class RequestError extends ServiceError {
    constructor(message = "Request error") {
      super(message);
      this.name = "RequestError";
      this.status = 400;
    }
  }

  class ConflictError extends ServiceError {
    constructor(message = "Resource conflict") {
      super(message);
      this.name = "ConflictError";
      this.status = 409;
    }
  }

  class AuthorizationError extends ServiceError {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "AuthorizationError";
      this.status = 401;
    }
  }

  class CredentialError extends ServiceError {
    constructor(message = "Forbidden") {
      super(message);
      this.name = "CredentialError";
      this.status = 403;
    }
  }

  var errors = {
    ServiceError,
    NotFoundError,
    RequestError,
    ConflictError,
    AuthorizationError,
    CredentialError,
  };

  const { ServiceError: ServiceError$1 } = errors;

  function createHandler(plugins, services) {
    return async function handler(req, res) {
      const method = req.method;
      console.info(`<< ${req.method} ${req.url}`);

      // Redirect fix for admin panel relative paths
      if (req.url.slice(-6) == "/admin") {
        res.writeHead(302, {
          Location: `http://${req.headers.host}/admin/`,
        });
        return res.end();
      }

      let status = 200;
      let headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      };
      let result = "";
      let context;

      // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
      if (method == "OPTIONS") {
        Object.assign(headers, {
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Credentials": false,
          "Access-Control-Max-Age": "86400",
          "Access-Control-Allow-Headers":
            "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin",
        });
      } else {
        try {
          context = processPlugins();
          await handle(context);
        } catch (err) {
          if (err instanceof ServiceError$1) {
            status = err.status || 400;
            result = composeErrorObject(err.code || status, err.message);
          } else {
            // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
            // If it happens, it must be debugged in a future version of the server
            console.error(err);
            status = 500;
            result = composeErrorObject(500, "Server Error");
          }
        }
      }

      res.writeHead(status, headers);
      if (
        context != undefined &&
        context.util != undefined &&
        context.util.throttle
      ) {
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      }
      res.end(result);

      function processPlugins() {
        const context = { params: {} };
        plugins.forEach((decorate) => decorate(context, req));
        return context;
      }

      async function handle(context) {
        const { serviceName, tokens, query, body } = await parseRequest(req);
        if (serviceName == "admin") {
          return ({ headers, result } = services["admin"](
            method,
            tokens,
            query,
            body
          ));
        } else if (serviceName == "favicon.ico") {
          return ({ headers, result } = services["favicon"](
            method,
            tokens,
            query,
            body
          ));
        }

        const service = services[serviceName];

        if (service === undefined) {
          status = 400;
          result = composeErrorObject(
            400,
            `Service "${serviceName}" is not supported`
          );
          console.error("Missing service " + serviceName);
        } else {
          result = await service(context, { method, tokens, query, body });
        }

        // NOTE: logout does not return a result
        // in this case the content type header should be omitted, to allow checks on the client
        if (result !== undefined) {
          result = JSON.stringify(result);
        } else {
          status = 204;
          delete headers["Content-Type"];
        }
      }
    };
  }

  function composeErrorObject(code, message) {
    return JSON.stringify({
      code,
      message,
    });
  }

  async function parseRequest(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const tokens = url.pathname.split("/").filter((x) => x.length > 0);
    const serviceName = tokens.shift();
    const queryString = url.search.split("?")[1] || "";
    const query = queryString
      .split("&")
      .filter((s) => s != "")
      .map((x) => x.split("="))
      .reduce(
        (p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v) }),
        {}
      );
    const body = await parseBody(req);

    return {
      serviceName,
      tokens,
      query,
      body,
    };
  }

  function parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          resolve(body);
        }
      });
    });
  }

  var requestHandler = createHandler;

  class Service {
    constructor() {
      this._actions = [];
      this.parseRequest = this.parseRequest.bind(this);
    }

    /**
     * Handle service request, after it has been processed by a request handler
     * @param {*} context Execution context, contains result of middleware processing
     * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
     */
    async parseRequest(context, request) {
      for (let { method, name, handler } of this._actions) {
        if (
          method === request.method &&
          matchAndAssignParams(context, request.tokens[0], name)
        ) {
          return await handler(
            context,
            request.tokens.slice(1),
            request.query,
            request.body
          );
        }
      }
    }

    /**
     * Register service action
     * @param {string} method HTTP method
     * @param {string} name Action name. Can be a glob pattern.
     * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
     */
    registerAction(method, name, handler) {
      this._actions.push({ method, name, handler });
    }

    /**
     * Register GET action
     * @param {string} name Action name. Can be a glob pattern.
     * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
     */
    get(name, handler) {
      this.registerAction("GET", name, handler);
    }

    /**
     * Register POST action
     * @param {string} name Action name. Can be a glob pattern.
     * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
     */
    post(name, handler) {
      this.registerAction("POST", name, handler);
    }

    /**
     * Register PUT action
     * @param {string} name Action name. Can be a glob pattern.
     * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
     */
    put(name, handler) {
      this.registerAction("PUT", name, handler);
    }

    /**
     * Register PATCH action
     * @param {string} name Action name. Can be a glob pattern.
     * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
     */
    patch(name, handler) {
      this.registerAction("PATCH", name, handler);
    }

    /**
     * Register DELETE action
     * @param {string} name Action name. Can be a glob pattern.
     * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
     */
    delete(name, handler) {
      this.registerAction("DELETE", name, handler);
    }
  }

  function matchAndAssignParams(context, name, pattern) {
    if (pattern == "*") {
      return true;
    } else if (pattern[0] == ":") {
      context.params[pattern.slice(1)] = name;
      return true;
    } else if (name == pattern) {
      return true;
    } else {
      return false;
    }
  }

  var Service_1 = Service;

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  var util = {
    uuid,
  };

  const uuid$1 = util.uuid;

  const data = fs__default["default"].existsSync("./data")
    ? fs__default["default"].readdirSync("./data").reduce((p, c) => {
        const content = JSON.parse(
          fs__default["default"].readFileSync("./data/" + c)
        );
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
          p[collection][endpoint] = content[endpoint];
        }
        return p;
      }, {})
    : {};

  const actions = {
    get: (context, tokens, query, body) => {
      tokens = [context.params.collection, ...tokens];
      let responseData = data;
      for (let token of tokens) {
        if (responseData !== undefined) {
          responseData = responseData[token];
        }
      }
      return responseData;
    },
    post: (context, tokens, query, body) => {
      tokens = [context.params.collection, ...tokens];
      console.log("Request body:\n", body);

      // TODO handle collisions, replacement
      let responseData = data;
      for (let token of tokens) {
        if (responseData.hasOwnProperty(token) == false) {
          responseData[token] = {};
        }
        responseData = responseData[token];
      }

      const newId = uuid$1();
      responseData[newId] = Object.assign({}, body, { _id: newId });
      return responseData[newId];
    },
    put: (context, tokens, query, body) => {
      tokens = [context.params.collection, ...tokens];
      console.log("Request body:\n", body);

      let responseData = data;
      for (let token of tokens.slice(0, -1)) {
        if (responseData !== undefined) {
          responseData = responseData[token];
        }
      }
      if (
        responseData !== undefined &&
        responseData[tokens.slice(-1)] !== undefined
      ) {
        responseData[tokens.slice(-1)] = body;
      }
      return responseData[tokens.slice(-1)];
    },
    patch: (context, tokens, query, body) => {
      tokens = [context.params.collection, ...tokens];
      console.log("Request body:\n", body);

      let responseData = data;
      for (let token of tokens) {
        if (responseData !== undefined) {
          responseData = responseData[token];
        }
      }
      if (responseData !== undefined) {
        Object.assign(responseData, body);
      }
      return responseData;
    },
    delete: (context, tokens, query, body) => {
      tokens = [context.params.collection, ...tokens];
      let responseData = data;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (responseData.hasOwnProperty(token) == false) {
          return null;
        }
        if (i == tokens.length - 1) {
          const body = responseData[token];
          delete responseData[token];
          return body;
        } else {
          responseData = responseData[token];
        }
      }
    },
  };

  const dataService = new Service_1();
  dataService.get(":collection", actions.get);
  dataService.post(":collection", actions.post);
  dataService.put(":collection", actions.put);
  dataService.patch(":collection", actions.patch);
  dataService.delete(":collection", actions.delete);

  var jsonstore = dataService.parseRequest;

  /*
   * This service requires storage and auth plugins
   */

  const { AuthorizationError: AuthorizationError$1 } = errors;

  const userService = new Service_1();

  userService.get("me", getSelf);
  userService.post("register", onRegister);
  userService.post("login", onLogin);
  userService.get("logout", onLogout);

  function getSelf(context, tokens, query, body) {
    if (context.user) {
      const result = Object.assign({}, context.user);
      delete result.hashedPassword;
      return result;
    } else {
      throw new AuthorizationError$1();
    }
  }

  function onRegister(context, tokens, query, body) {
    return context.auth.register(body);
  }

  function onLogin(context, tokens, query, body) {
    return context.auth.login(body);
  }

  function onLogout(context, tokens, query, body) {
    return context.auth.logout();
  }

  var users = userService.parseRequest;

  const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } =
    errors;

  var crud = {
    get,
    post,
    put,
    patch,
    delete: del,
  };

  function validateRequest(context, tokens, query) {
    /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
    if (tokens.length > 1) {
      throw new RequestError$1();
    }
  }

  function parseWhere(query) {
    const operators = {
      "<=": (prop, value) => (record) => record[prop] <= JSON.parse(value),
      "<": (prop, value) => (record) => record[prop] < JSON.parse(value),
      ">=": (prop, value) => (record) => record[prop] >= JSON.parse(value),
      ">": (prop, value) => (record) => record[prop] > JSON.parse(value),
      "=": (prop, value) => (record) => record[prop] == JSON.parse(value),
      " like ": (prop, value) => (record) =>
        record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
      " in ": (prop, value) => (record) =>
        JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
    };
    const pattern = new RegExp(
      `^(.+?)(${Object.keys(operators).join("|")})(.+?)$`,
      "i"
    );

    try {
      let clauses = [query.trim()];
      let check = (a, b) => b;
      let acc = true;
      if (query.match(/ and /gi)) {
        // inclusive
        clauses = query.split(/ and /gi);
        check = (a, b) => a && b;
        acc = true;
      } else if (query.match(/ or /gi)) {
        // optional
        clauses = query.split(/ or /gi);
        check = (a, b) => a || b;
        acc = false;
      }
      clauses = clauses.map(createChecker);

      return (record) => clauses.map((c) => c(record)).reduce(check, acc);
    } catch (err) {
      throw new Error("Could not parse WHERE clause, check your syntax.");
    }

    function createChecker(clause) {
      let [match, prop, operator, value] = pattern.exec(clause);
      [prop, value] = [prop.trim(), value.trim()];

      return operators[operator.toLowerCase()](prop, value);
    }
  }

  function get(context, tokens, query, body) {
    validateRequest(context, tokens);

    let responseData;

    try {
      if (query.where) {
        responseData = context.storage
          .get(context.params.collection)
          .filter(parseWhere(query.where));
      } else if (context.params.collection) {
        responseData = context.storage.get(
          context.params.collection,
          tokens[0]
        );
      } else {
        // Get list of collections
        return context.storage.get();
      }

      if (query.sortBy) {
        const props = query.sortBy
          .split(",")
          .filter((p) => p != "")
          .map((p) => p.split(" ").filter((p) => p != ""))
          .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

        // Sorting priority is from first to last, therefore we sort from last to first
        for (let i = props.length - 1; i >= 0; i--) {
          let { prop, desc } = props[i];
          responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
            if (typeof propA == "number" && typeof propB == "number") {
              return (propA - propB) * (desc ? -1 : 1);
            } else {
              return propA.localeCompare(propB) * (desc ? -1 : 1);
            }
          });
        }
      }

      if (query.offset) {
        responseData = responseData.slice(Number(query.offset) || 0);
      }
      const pageSize = Number(query.pageSize) || 10;
      if (query.pageSize) {
        responseData = responseData.slice(0, pageSize);
      }

      if (query.distinct) {
        const props = query.distinct.split(",").filter((p) => p != "");
        responseData = Object.values(
          responseData.reduce((distinct, c) => {
            const key = props.map((p) => c[p]).join("::");
            if (distinct.hasOwnProperty(key) == false) {
              distinct[key] = c;
            }
            return distinct;
          }, {})
        );
      }

      if (query.count) {
        return responseData.length;
      }

      if (query.select) {
        const props = query.select.split(",").filter((p) => p != "");
        responseData = Array.isArray(responseData)
          ? responseData.map(transform)
          : transform(responseData);

        function transform(r) {
          const result = {};
          props.forEach((p) => (result[p] = r[p]));
          return result;
        }
      }

      if (query.load) {
        const props = query.load.split(",").filter((p) => p != "");
        props.map((prop) => {
          const [propName, relationTokens] = prop.split("=");
          const [idSource, collection] = relationTokens.split(":");
          console.log(
            `Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`
          );
          const storageSource =
            collection == "users" ? context.protectedStorage : context.storage;
          responseData = Array.isArray(responseData)
            ? responseData.map(transform)
            : transform(responseData);

          function transform(r) {
            const seekId = r[idSource];
            const related = storageSource.get(collection, seekId);
            delete related.hashedPassword;
            r[propName] = related;
            return r;
          }
        });
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes("does not exist")) {
        throw new NotFoundError$1();
      } else {
        throw new RequestError$1(err.message);
      }
    }

    context.canAccess(responseData);

    return responseData;
  }

  function post(context, tokens, query, body) {
    console.log("Request body:\n", body);

    validateRequest(context, tokens);
    if (tokens.length > 0) {
      throw new RequestError$1("Use PUT to update records");
    }
    context.canAccess(undefined, body);

    body._ownerId = context.user._id;
    let responseData;

    try {
      responseData = context.storage.add(context.params.collection, body);
    } catch (err) {
      throw new RequestError$1();
    }

    return responseData;
  }

  function put(context, tokens, query, body) {
    console.log("Request body:\n", body);

    validateRequest(context, tokens);
    if (tokens.length != 1) {
      throw new RequestError$1("Missing entry ID");
    }

    let responseData;
    let existing;

    try {
      existing = context.storage.get(context.params.collection, tokens[0]);
    } catch (err) {
      throw new NotFoundError$1();
    }

    context.canAccess(existing, body);

    try {
      responseData = context.storage.set(
        context.params.collection,
        tokens[0],
        body
      );
    } catch (err) {
      throw new RequestError$1();
    }

    return responseData;
  }

  function patch(context, tokens, query, body) {
    console.log("Request body:\n", body);

    validateRequest(context, tokens);
    if (tokens.length != 1) {
      throw new RequestError$1("Missing entry ID");
    }

    let responseData;
    let existing;

    try {
      existing = context.storage.get(context.params.collection, tokens[0]);
    } catch (err) {
      throw new NotFoundError$1();
    }

    context.canAccess(existing, body);

    try {
      responseData = context.storage.merge(
        context.params.collection,
        tokens[0],
        body
      );
    } catch (err) {
      throw new RequestError$1();
    }

    return responseData;
  }

  function del(context, tokens, query, body) {
    validateRequest(context, tokens);
    if (tokens.length != 1) {
      throw new RequestError$1("Missing entry ID");
    }

    let responseData;
    let existing;

    try {
      existing = context.storage.get(context.params.collection, tokens[0]);
    } catch (err) {
      throw new NotFoundError$1();
    }

    context.canAccess(existing);

    try {
      responseData = context.storage.delete(
        context.params.collection,
        tokens[0]
      );
    } catch (err) {
      throw new RequestError$1();
    }

    return responseData;
  }

  /*
   * This service requires storage and auth plugins
   */

  const dataService$1 = new Service_1();
  dataService$1.get(":collection", crud.get);
  dataService$1.post(":collection", crud.post);
  dataService$1.put(":collection", crud.put);
  dataService$1.patch(":collection", crud.patch);
  dataService$1.delete(":collection", crud.delete);

  var data$1 = dataService$1.parseRequest;

  const imgdata =
    "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAPNnpUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHja7ZpZdiS7DUT/uQovgSQ4LofjOd6Bl+8LZqpULbWm7vdnqyRVKQeCBAKBAFNm/eff2/yLr2hzMSHmkmpKlq9QQ/WND8VeX+38djac3+cr3af4+5fj5nHCc0h4l+vP8nJicdxzeN7Hxz1O43h8Gmi0+0T/9cT09/jlNuAeBs+XuMuAvQ2YeQ8k/jrhwj2Re3mplvy8hH3PKPr7SLl+jP6KkmL2OeErPnmbQ9q8Rmb0c2ynxafzO+eET7mC65JPjrM95exN2jmmlYLnophSTKLDZH+GGAwWM0cyt3C8nsHWWeG4Z/Tio7cHQiZ2M7JK8X6JE3t++2v5oj9O2nlvfApc50SkGQ5FDnm5B2PezJ8Bw1PUPvl6cYv5G788u8V82y/lPTgfn4CC+e2JN+Ds5T4ubzCVHu8M9JsTLr65QR5m/LPhvh6G/S8zcs75XzxZXn/2nmXvda2uhURs051x51bzMgwXdmIl57bEK/MT+ZzPq/IqJPEA+dMO23kNV50HH9sFN41rbrvlJu/DDeaoMci8ez+AjB4rkn31QxQxQV9u+yxVphRgM8CZSDDiH3Nxx2499oYrWJ6OS71jMCD5+ct8dcF3XptMNupie4XXXQH26nCmoZHT31xGQNy+4xaPg19ejy/zFFghgvG4ubDAZvs1RI/uFVtyACBcF3m/0sjlqVHzByUB25HJOCEENjmJLjkL2LNzQXwhQI2Ze7K0EwEXo59M0geRRGwKOMI292R3rvXRX8fhbuJDRkomNlUawQohgp8cChhqUWKIMZKxscQamyEBScaU0knM1E6WxUxO5pJrbkVKKLGkkksptbTqq1AjYiWLa6m1tobNFkyLjbsbV7TWfZceeuyp51567W0AnxFG1EweZdTRpp8yIayZZp5l1tmWI6fFrLDiSiuvsupqG6xt2WFHOCXvsutuj6jdUX33+kHU3B01fyKl1+VH1Diasw50hnDKM1FjRsR8cEQ8awQAtNeY2eJC8Bo5jZmtnqyInklGjc10thmXCGFYzsftHrF7jdy342bw9Vdx89+JnNHQ/QOR82bJm7j9JmqnGo8TsSsL1adWyD7Or9J8aTjbXx/+9v3/A/1vDUS9tHOXtLaM6JoBquRHJFHdaNU5oF9rKVSjYNewoFNsW032cqqCCx/yljA2cOy7+7zJ0biaicv1TcrWXSDXVT3SpkldUqqPIJj8p9oeWVs4upKL3ZHgpNzYnTRv5EeTYXpahYRgfC+L/FyxBphCmPLK3W1Zu1QZljTMJe5AIqmOyl0qlaFCCJbaPAIMWXzurWAMXiB1fGDtc+ld0ZU12k5cQq4v7+AB2x3qLlQ3hyU/uWdzzgUTKfXSputZRtp97hZ3z4EE36WE7WtjbqMtMr912oRp47HloZDlywxJ+uyzmrW91OivysrM1Mt1rZbrrmXm2jZrYWVuF9xZVB22jM4ccdaE0kh5jIrnzBy5w6U92yZzS1wrEao2ZPnE0tL0eRIpW1dOWuZ1WlLTqm7IdCESsV5RxjQ1/KWC/y/fPxoINmQZI8Cli9oOU+MJYgrv006VQbRGC2Ug8TYzrdtUHNjnfVc6/oN8r7tywa81XHdZN1QBUhfgzRLzmPCxu1G4sjlRvmF4R/mCYdUoF2BYNMq4AjD2GkMGhEt7PAJfKrH1kHmj8eukyLb1oCGW/WdAtx0cURYqtcGnNlAqods6UnaRpY3LY8GFbPeSrjKmsvhKnWTtdYKhRW3TImUqObdpGZgv3ltrdPwwtD+l1FD/htxAwjdUzhtIkWNVy+wBUmDtphwgVemd8jV1miFXWTpumqiqvnNuArCrFMbLPexJYpABbamrLiztZEIeYPasgVbnz9/NZxe4p/B+FV3zGt79B9S0Jc0Lu+YH4FXsAsa2YnRIAb2thQmGc17WdNd9cx4+y4P89EiVRKB+CvRkiPTwM7Ts+aZ5aV0C4zGoqyOGJv3yGMJaHXajKbOGkm40Ychlkw6c6hZ4s+SDJpsmncwmm8ChEmBWspX8MkFB+kzF1ZlgoGWiwzY6w4AIPDOcJxV3rtUnabEgoNBB4MbNm8GlluVIpsboaKl0YR8kGnXZH3JQZrH2MDxxRrHFUduh+CvQszakraM9XNo7rEVjt8VpbSOnSyD5dwLfVI4+Sl+DCZc5zU6zhrXnRhZqUowkruyZupZEm/dA2uVTroDg1nfdJMBua9yCJ8QPtGw2rkzlYLik5SBzUGSoOqBMJvwTe92eGgOVx8/T39TP0r/PYgfkP1IEyGVhYHXyJiVPU0skB3dGqle6OZuwj/Hw5c2gV5nEM6TYaAryq3CRXsj1088XNwt0qcliqNc6bfW+TttRydKpeJOUWTmmUiwJKzpr6hkVzzLrVs+s66xEiCwOzfg5IRgwQgFgrriRlg6WQS/nGyRUNDjulWsUbO8qu/lWaWeFe8QTs0puzrxXH1H0b91KgDm2dkdrpkpx8Ks2zZu4K1GHPpDxPdCL0RH0SZZrGX8hRKTA+oUPzQ+I0K1C16ZSK6TR28HUdlnfpzMsIvd4TR7iuSe/+pn8vief46IQULRGcHvRVUyn9aYeoHbGhEbct+vEuzIxhxJrgk1oyo3AFA7eSSSNI/Vxl0eLMCrJ/j1QH0ybj0C9VCn9BtXbz6Kd10b8QKtpTnecbnKHWZxcK2OiKCuViBHqrzM2T1uFlGJlMKFKRF1Zy6wMqQYtgKYc4PFoGv2dX2ixqGaoFDhjzRmp4fsygFZr3t0GmBqeqbcBFpvsMVCNajVWcLRaPBhRKc4RCCUGZphKJdisKdRjDKdaNbZfwM5BulzzCvyv0AsAlu8HOAdIXAuMAg0mWa0+0vgrODoHlm7Y7rXUHmm9r2RTLpXwOfOaT6iZdASpqOIXfiABLwQkrSPFXQgAMHjYyEVrOBESVgS4g4AxcXyiPwBiCF6g2XTPk0hqn4D67rbQVFv0Lam6Vfmvq90B3WgV+peoNRb702/tesrImcBCvIEaGoI/8YpKa1XmDNr1aGUwjDETBa3VkOLYVLGKeWQcd+WaUlsMdTdUg3TcUPvdT20ftDW4+injyAarDRVVRgc906sNTo1cu7LkDGewjkQ35Z7l4Htnx9MCkbenKiNMsif+5BNVnA6op3gZVZtjIAacNia+00w1ZutIibTMOJ7IISctvEQGDxEYDUSxUiH4R4kkH86dMywCqVJ2XpzkUYUgW3mDPmz0HLW6w9daRn7abZmo4QR5i/A21r4oEvCC31oajm5CR1yBZcIfN7rmgxM9qZBhXh3C6NR9dCS1PTMJ30c4fEcwkq0IXdphpB9eg4x1zycsof4t6C4jyS68eW7OonpSEYCzb5dWjQH3H5fWq2SH41O4LahPrSJA77KqpJYwH6pdxDfDIgxLR9GptCKMoiHETrJ0wFSR3Sk7yI97KdBVSHXeS5FBnYKIz1JU6VhdCkfHIP42o0V6aqgg00JtZfdK6hPeojtXvgfnE/VX0p0+fqxp2/nDfvBuHgeo7ppkrr/MyU1dT73n5B/qi76+lzMnVnHRJDeZOyj3XXdQrrtOUPQunDqgDlz+iuS3QDafITkJd050L0Hi2kiRBX52pIVso0ZpW1YQsT2VRgtxm9iiqU2qXyZ0OdvZy0J1gFotZFEuGrnt3iiiXvECX+UcWBqpPlgLRkdN7cpl8PxDjWseAu1bPdCjBSrQeVD2RHE7bRhMb1Qd3VHVXVNBewZ3Wm7avbifhB+4LNQrmp0WxiCNkm7dd7mV39SnokrvfzIr+oDSFq1D76MZchw6Vl4Z67CL01I6ZiX/VEqfM1azjaSkKqC+kx67tqTg5ntLii5b96TAA3wMTx2NvqsyyUajYQHJ1qkpmzHQITXDUZRGTYtNw9uLSndMmI9tfMdEeRgwWHB7NlosyivZPlvT5KIOc+GefU9UhA4MmKFXmhAuJRFVWHRJySbREImpQysz4g3uJckihD7P84nWtLo7oR4tr8IKdSBXYvYaZnm3ffhh9nyWPDa+zQfzdULsFlr/khrMb7hhAroOKSZgxbUzqdiVIhQc+iZaTbpesLXSbIfbjwXTf8AjbnV6kTpD4ZsMdXMK45G1NRiMdh/bLb6oXX+4rWHen9BW+xJDV1N+i6HTlKdLDMnVkx8tdHryus3VlCOXXKlDIiuOkimXnmzmrtbGqmAHL1TVXU73PX5nx3xhSO3QKtBqbd31iQHHBNXXrYIXHVyQqDGIcc6qHEcz2ieN+radKS9br/cGzC0G7g0YFQPGdqs7MI6pOt2BgYtt/4MNW8NJ3VT5es/izZZFd9yIfwY1lUubGSSnPiWWzDpAN+sExNptEoBx74q8bAzdFu6NocvC2RgK2WR7doZodiZ6OgoUrBoWIBM2xtMHXUX3GGktr5RtwPZ9tTWfleFP3iEc2hTar6IC1Y55ktYKQtXTsKkfgQ+al0aXBCh2dlCxdBtLtc8QJ4WUKIX+jlRR/TN9pXpNA1bUC7LaYUzJvxr6rh2Q7ellILBd0PcFF5F6uArA6ODZdjQYosZpf7lbu5kNFfbGUUY5C2p7esLhhjw94Miqk+8tDPgTVXX23iliu782KzsaVdexRSq4NORtmY3erV/NFsJU9S7naPXmPGLYvuy5USQA2pcb4z/fYafpPj0t5HEeD1y7W/Z+PHA2t8L1eGCCeFS/Ph04Hafu+Uf8ly2tjUNDQnNUIOqVLrBLIwxK67p3fP7LaX/LjnlniCYv6jNK0ce5YrPud1Gc6LQWg+sumIt2hCCVG3e8e5tsLAL2qWekqp1nKPKqKIJcmxO3oljxVa1TXVDVWmxQ/lhHHnYNP9UDrtFdwekRKCueDRSRAYoo0nEssbG3znTTDahVUXyDj+afeEhn3w/UyY0fSv5b8ZuSmaDVrURYmBrf0ZgIMOGuGFNG3FH45iA7VFzUnj/odcwHzY72OnQEhByP3PtKWxh/Q+/hkl9x5lEic5ojDGgEzcSpnJEwY2y6ZN0RiyMBhZQ35AigLvK/dt9fn9ZJXaHUpf9Y4IxtBSkanMxxP6xb/pC/I1D1icMLDcmjZlj9L61LoIyLxKGRjUcUtOiFju4YqimZ3K0odbd1Usaa7gPp/77IJRuOmxAmqhrWXAPOftoY0P/BsgifTmC2ChOlRSbIMBjjm3bQIeahGwQamM9wHqy19zaTCZr/AtjdNfWMu8SZAAAA13pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHjaPU9LjkMhDNtzijlCyMd5HKflgdRdF72/xmFGJSIEx9ihvd6f2X5qdWizy9WH3+KM7xrRp2iw6hLARIfnSKsqoRKGSEXA0YuZVxOx+QcnMMBKJR2bMdNUDraxWJ2ciQuDDPKgNDA8kakNOwMLriTRO2Alk3okJsUiidC9Ex9HbNUMWJz28uQIzhhNxQduKhdkujHiSJVTCt133eqpJX/6MDXh7nrXydzNq9tssr14NXuwFXaoh/CPiLRfLvxMyj3GtTgAAAGFaUNDUElDQyBwcm9maWxlAAB4nH2RPUjDQBzFX1NFKfUD7CDikKE6WRAVESepYhEslLZCqw4ml35Bk4YkxcVRcC04+LFYdXBx1tXBVRAEP0Dc3JwUXaTE/yWFFjEeHPfj3b3H3TtAqJeZanaMA6pmGclYVMxkV8WuVwjoRQCz6JeYqcdTi2l4jq97+Ph6F+FZ3uf+HD1KzmSATySeY7phEW8QT29aOud94hArSgrxOfGYQRckfuS67PIb54LDAs8MGenkPHGIWCy0sdzGrGioxFPEYUXVKF/IuKxw3uKslquseU/+wmBOW0lxneYwYlhCHAmIkFFFCWVYiNCqkWIiSftRD/+Q40+QSyZXCYwcC6hAheT4wf/gd7dmfnLCTQpGgc4X2/4YAbp2gUbNtr+PbbtxAvifgSut5a/UgZlP0mstLXwE9G0DF9ctTd4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC";
  const img = Buffer.from(imgdata, "base64");

  var favicon = (method, tokens, query, body) => {
    console.log("serving favicon...");
    const headers = {
      "Content-Type": "image/png",
      "Content-Length": img.length,
    };
    let result = img;

    return {
      headers,
      result,
    };
  };

  var require$$0 =
    '<!DOCTYPE html>\r\n<html lang="en">\r\n<head>\r\n    <meta charset="UTF-8">\r\n    <meta http-equiv="X-UA-Compatible" content="IE=edge">\r\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: \'\';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type="module">\nimport { html, render } from \'https://unpkg.com/lit-html@1.3.0?module\';\nimport { until } from \'https://unpkg.com/lit-html@1.3.0/directives/until?module\';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: \'POST\',\r\n            headers: { \'Content-Type\': \'application/json\' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch(\'/\' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get(\'data\');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get(\'data/\' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get(\'util/throttle\');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post(\'util\', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class="collection-list">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href="javascript:void(0)" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set([\'_id\']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from \'//unpkg.com/page/page.mjs\';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector(\'main\');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class="col">Loading&hellip;</div>`;\r\n    let viewer = html`<div class="col">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class="col">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class="layout">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class="layout">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class="col">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>';

  const mode = process.argv[2] == "-dev" ? "dev" : "prod";

  const files = {
    index:
      mode == "prod"
        ? require$$0
        : fs__default["default"].readFileSync("./client/index.html", "utf-8"),
  };

  var admin = (method, tokens, query, body) => {
    const headers = {
      "Content-Type": "text/html",
    };
    let result = "";

    const resource = tokens.join("/");
    if (resource && resource.split(".").pop() == "js") {
      headers["Content-Type"] = "application/javascript";

      files[resource] =
        files[resource] ||
        fs__default["default"].readFileSync("./client/" + resource, "utf-8");
      result = files[resource];
    } else {
      result = files.index;
    }

    return {
      headers,
      result,
    };
  };

  /*
   * This service requires util plugin
   */

  const utilService = new Service_1();

  utilService.post("*", onRequest);
  utilService.get(":service", getStatus);

  function getStatus(context, tokens, query, body) {
    return context.util[context.params.service];
  }

  function onRequest(context, tokens, query, body) {
    Object.entries(body).forEach(([k, v]) => {
      console.log(`${k} ${v ? "enabled" : "disabled"}`);
      context.util[k] = v;
    });
    return "";
  }

  var util$1 = utilService.parseRequest;

  var services = {
    jsonstore,
    users,
    data: data$1,
    favicon,
    admin,
    util: util$1,
  };

  const { uuid: uuid$2 } = util;

  function initPlugin(settings) {
    const storage = createInstance(settings.seedData);
    const protectedStorage = createInstance(settings.protectedData);

    return function decoreateContext(context, request) {
      context.storage = storage;
      context.protectedStorage = protectedStorage;
    };
  }

  /**
   * Create storage instance and populate with seed data
   * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
   */
  function createInstance(seedData = {}) {
    const collections = new Map();

    // Initialize seed data from file
    for (let collectionName in seedData) {
      if (seedData.hasOwnProperty(collectionName)) {
        const collection = new Map();
        for (let recordId in seedData[collectionName]) {
          if (seedData.hasOwnProperty(collectionName)) {
            collection.set(recordId, seedData[collectionName][recordId]);
          }
        }
        collections.set(collectionName, collection);
      }
    }

    // Manipulation

    /**
     * Get entry by ID or list of all entries from collection or list of all collections
     * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
     * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
     * @return {Object} Matching entry.
     */
    function get(collection, id) {
      if (!collection) {
        return [...collections.keys()];
      }
      if (!collections.has(collection)) {
        throw new ReferenceError("Collection does not exist: " + collection);
      }
      const targetCollection = collections.get(collection);
      if (!id) {
        const entries = [...targetCollection.entries()];
        let result = entries.map(([k, v]) => {
          return Object.assign(deepCopy(v), { _id: k });
        });
        return result;
      }
      if (!targetCollection.has(id)) {
        throw new ReferenceError("Entry does not exist: " + id);
      }
      const entry = targetCollection.get(id);
      return Object.assign(deepCopy(entry), { _id: id });
    }

    /**
     * Add new entry to collection. ID will be auto-generated
     * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
     * @param {Object} data Value to store.
     * @return {Object} Original value with resulting ID under _id property.
     */
    function add(collection, data) {
      const record = assignClean({ _ownerId: data._ownerId }, data);

      let targetCollection = collections.get(collection);
      if (!targetCollection) {
        targetCollection = new Map();
        collections.set(collection, targetCollection);
      }
      let id = uuid$2();
      // Make sure new ID does not match existing value
      while (targetCollection.has(id)) {
        id = uuid$2();
      }

      record._createdOn = Date.now();
      targetCollection.set(id, record);
      return Object.assign(deepCopy(record), { _id: id });
    }

    /**
     * Replace entry by ID
     * @param {string} collection Name of collection to access. Throws error if not found.
     * @param {number|string} id ID of entry to update. Throws error if not found.
     * @param {Object} data Value to store. Record will be replaced!
     * @return {Object} Updated entry.
     */
    function set(collection, id, data) {
      if (!collections.has(collection)) {
        throw new ReferenceError("Collection does not exist: " + collection);
      }
      const targetCollection = collections.get(collection);
      if (!targetCollection.has(id)) {
        throw new ReferenceError("Entry does not exist: " + id);
      }

      const existing = targetCollection.get(id);
      const record = assignSystemProps(deepCopy(data), existing);
      record._updatedOn = Date.now();
      targetCollection.set(id, record);
      return Object.assign(deepCopy(record), { _id: id });
    }

    /**
     * Modify entry by ID
     * @param {string} collection Name of collection to access. Throws error if not found.
     * @param {number|string} id ID of entry to update. Throws error if not found.
     * @param {Object} data Value to store. Shallow merge will be performed!
     * @return {Object} Updated entry.
     */
    function merge(collection, id, data) {
      if (!collections.has(collection)) {
        throw new ReferenceError("Collection does not exist: " + collection);
      }
      const targetCollection = collections.get(collection);
      if (!targetCollection.has(id)) {
        throw new ReferenceError("Entry does not exist: " + id);
      }

      const existing = deepCopy(targetCollection.get(id));
      const record = assignClean(existing, data);
      record._updatedOn = Date.now();
      targetCollection.set(id, record);
      return Object.assign(deepCopy(record), { _id: id });
    }

    /**
     * Delete entry by ID
     * @param {string} collection Name of collection to access. Throws error if not found.
     * @param {number|string} id ID of entry to update. Throws error if not found.
     * @return {{_deletedOn: number}} Server time of deletion.
     */
    function del(collection, id) {
      if (!collections.has(collection)) {
        throw new ReferenceError("Collection does not exist: " + collection);
      }
      const targetCollection = collections.get(collection);
      if (!targetCollection.has(id)) {
        throw new ReferenceError("Entry does not exist: " + id);
      }
      targetCollection.delete(id);

      return { _deletedOn: Date.now() };
    }

    /**
     * Search in collection by query object
     * @param {string} collection Name of collection to access. Throws error if not found.
     * @param {Object} query Query object. Format {prop: value}.
     * @return {Object[]} Array of matching entries.
     */
    function query(collection, query) {
      if (!collections.has(collection)) {
        throw new ReferenceError("Collection does not exist: " + collection);
      }
      const targetCollection = collections.get(collection);
      const result = [];
      // Iterate entries of target collection and compare each property with the given query
      for (let [key, entry] of [...targetCollection.entries()]) {
        let match = true;
        for (let prop in entry) {
          if (query.hasOwnProperty(prop)) {
            const targetValue = query[prop];
            // Perform lowercase search, if value is string
            if (
              typeof targetValue === "string" &&
              typeof entry[prop] === "string"
            ) {
              if (
                targetValue.toLocaleLowerCase() !==
                entry[prop].toLocaleLowerCase()
              ) {
                match = false;
                break;
              }
            } else if (targetValue != entry[prop]) {
              match = false;
              break;
            }
          }
        }

        if (match) {
          result.push(Object.assign(deepCopy(entry), { _id: key }));
        }
      }

      return result;
    }

    return { get, add, set, merge, delete: del, query };
  }

  function assignSystemProps(target, entry, ...rest) {
    const whitelist = ["_id", "_createdOn", "_updatedOn", "_ownerId"];
    for (let prop of whitelist) {
      if (entry.hasOwnProperty(prop)) {
        target[prop] = deepCopy(entry[prop]);
      }
    }
    if (rest.length > 0) {
      Object.assign(target, ...rest);
    }

    return target;
  }

  function assignClean(target, entry, ...rest) {
    const blacklist = ["_id", "_createdOn", "_updatedOn", "_ownerId"];
    for (let key in entry) {
      if (blacklist.includes(key) == false) {
        target[key] = deepCopy(entry[key]);
      }
    }
    if (rest.length > 0) {
      Object.assign(target, ...rest);
    }

    return target;
  }

  function deepCopy(value) {
    if (Array.isArray(value)) {
      return value.map(deepCopy);
    } else if (typeof value == "object") {
      return [...Object.entries(value)].reduce(
        (p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }),
        {}
      );
    } else {
      return value;
    }
  }

  var storage = initPlugin;

  const {
    ConflictError: ConflictError$1,
    CredentialError: CredentialError$1,
    RequestError: RequestError$2,
  } = errors;

  function initPlugin$1(settings) {
    const identity = settings.identity;

    return function decorateContext(context, request) {
      context.auth = {
        register,
        login,
        logout,
      };

      const userToken = request.headers["x-authorization"];
      if (userToken !== undefined) {
        let user;
        const session = findSessionByToken(userToken);
        if (session !== undefined) {
          const userData = context.protectedStorage.get(
            "users",
            session.userId
          );
          if (userData !== undefined) {
            console.log("Authorized as " + userData[identity]);
            user = userData;
          }
        }
        if (user !== undefined) {
          context.user = user;
        } else {
          throw new CredentialError$1("Invalid access token");
        }
      }

      function register(body) {
        if (
          body.hasOwnProperty(identity) === false ||
          body.hasOwnProperty("password") === false ||
          body[identity].length == 0 ||
          body.password.length == 0
        ) {
          throw new RequestError$2("Missing fields");
        } else if (
          context.protectedStorage.query("users", {
            [identity]: body[identity],
          }).length !== 0
        ) {
          throw new ConflictError$1(
            `A user with the same ${identity} already exists`
          );
        } else {
          const newUser = Object.assign({}, body, {
            [identity]: body[identity],
            hashedPassword: hash(body.password),
          });
          const result = context.protectedStorage.add("users", newUser);
          delete result.hashedPassword;

          const session = saveSession(result._id);
          result.accessToken = session.accessToken;

          return result;
        }
      }

      function login(body) {
        const targetUser = context.protectedStorage.query("users", {
          [identity]: body[identity],
        });
        if (targetUser.length == 1) {
          if (hash(body.password) === targetUser[0].hashedPassword) {
            const result = targetUser[0];
            delete result.hashedPassword;

            const session = saveSession(result._id);
            result.accessToken = session.accessToken;

            return result;
          } else {
            throw new CredentialError$1("Login or password don't match");
          }
        } else {
          throw new CredentialError$1("Login or password don't match");
        }
      }

      function logout() {
        if (context.user !== undefined) {
          const session = findSessionByUserId(context.user._id);
          if (session !== undefined) {
            context.protectedStorage.delete("sessions", session._id);
          }
        } else {
          throw new CredentialError$1("User session does not exist");
        }
      }

      function saveSession(userId) {
        let session = context.protectedStorage.add("sessions", { userId });
        const accessToken = hash(session._id);
        session = context.protectedStorage.set(
          "sessions",
          session._id,
          Object.assign({ accessToken }, session)
        );
        return session;
      }

      function findSessionByToken(userToken) {
        return context.protectedStorage.query("sessions", {
          accessToken: userToken,
        })[0];
      }

      function findSessionByUserId(userId) {
        return context.protectedStorage.query("sessions", { userId })[0];
      }
    };
  }

  const secret = "This is not a production server";

  function hash(string) {
    const hash = crypto__default["default"].createHmac("sha256", secret);
    hash.update(string);
    return hash.digest("hex");
  }

  var auth = initPlugin$1;

  function initPlugin$2(settings) {
    const util = {
      throttle: false,
    };

    return function decoreateContext(context, request) {
      context.util = util;
    };
  }

  var util$2 = initPlugin$2;

  /*
   * This plugin requires auth and storage plugins
   */

  const {
    RequestError: RequestError$3,
    ConflictError: ConflictError$2,
    CredentialError: CredentialError$2,
    AuthorizationError: AuthorizationError$2,
  } = errors;

  function initPlugin$3(settings) {
    const actions = {
      GET: ".read",
      POST: ".create",
      PUT: ".update",
      PATCH: ".update",
      DELETE: ".delete",
    };
    const rules = Object.assign(
      {
        "*": {
          ".create": ["User"],
          ".update": ["Owner"],
          ".delete": ["Owner"],
        },
      },
      settings.rules
    );

    return function decorateContext(context, request) {
      // special rules (evaluated at run-time)
      const get = (collectionName, id) => {
        return context.storage.get(collectionName, id);
      };
      const isOwner = (user, object) => {
        return user._id == object._ownerId;
      };
      context.rules = {
        get,
        isOwner,
      };
      const isAdmin = request.headers.hasOwnProperty("x-admin");

      context.canAccess = canAccess;

      function canAccess(data, newData) {
        const user = context.user;
        const action = actions[request.method];
        let { rule, propRules } = getRule(
          action,
          context.params.collection,
          data
        );

        if (Array.isArray(rule)) {
          rule = checkRoles(rule, data);
        } else if (typeof rule == "string") {
          rule = !!eval(rule);
        }
        if (!rule && !isAdmin) {
          throw new CredentialError$2();
        }
        propRules.map((r) => applyPropRule(action, r, user, data, newData));
      }

      function applyPropRule(action, [prop, rule], user, data, newData) {
        // NOTE: user needs to be in scope for eval to work on certain rules
        if (typeof rule == "string") {
          rule = !!eval(rule);
        }

        if (rule == false) {
          if (action == ".create" || action == ".update") {
            delete newData[prop];
          } else if (action == ".read") {
            delete data[prop];
          }
        }
      }

      function checkRoles(roles, data, newData) {
        if (roles.includes("Guest")) {
          return true;
        } else if (!context.user && !isAdmin) {
          throw new AuthorizationError$2();
        } else if (roles.includes("User")) {
          return true;
        } else if (context.user && roles.includes("Owner")) {
          return context.user._id == data._ownerId;
        } else {
          return false;
        }
      }
    };

    function getRule(action, collection, data = {}) {
      let currentRule = ruleOrDefault(true, rules["*"][action]);
      let propRules = [];

      // Top-level rules for the collection
      const collectionRules = rules[collection];
      if (collectionRules !== undefined) {
        // Top-level rule for the specific action for the collection
        currentRule = ruleOrDefault(currentRule, collectionRules[action]);

        // Prop rules
        const allPropRules = collectionRules["*"];
        if (allPropRules !== undefined) {
          propRules = ruleOrDefault(
            propRules,
            getPropRule(allPropRules, action)
          );
        }

        // Rules by record id
        const recordRules = collectionRules[data._id];
        if (recordRules !== undefined) {
          currentRule = ruleOrDefault(currentRule, recordRules[action]);
          propRules = ruleOrDefault(
            propRules,
            getPropRule(recordRules, action)
          );
        }
      }

      return {
        rule: currentRule,
        propRules,
      };
    }

    function ruleOrDefault(current, rule) {
      return rule === undefined || rule.length === 0 ? current : rule;
    }

    function getPropRule(record, action) {
      const props = Object.entries(record)
        .filter(([k]) => k[0] != ".")
        .filter(([k, v]) => v.hasOwnProperty(action))
        .map(([k, v]) => [k, v[action]]);

      return props;
    }
  }

  var rules = initPlugin$3;

  var identity = "email";
  var protectedData = {
    users: {
      "35c62d76-8152-4626-8712-eeb96381bea8": {
        email: "peter@abv.bg",
        username: "Peter",
        hashedPassword:
          "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1",
      },
      "847ec027-f659-4086-8032-5173e2f9c93a": {
        email: "george@abv.bg",
        username: "George",
        hashedPassword:
          "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1",
      },
      "60f0cf0b-34b0-4abd-9769-8c42f830dffc": {
        email: "admin@abv.bg",
        username: "Admin",
        hashedPassword:
          "fac7060c3e17e6f151f247eacb2cd5ae80b8c36aedb8764e18a41bbdc16aa302",
      },
    },
    sessions: {},
  };
  var seedData = {
    vocabulary: {
      "34a1cab1-81f1-47e5-aec3-afff9810e001": {
        _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
        _createdOn: "1721469649111",
        title: "Present simple tense",
        level: "A1",
        description:
          "This training module is designed for beginners who want to learn a foreign language at the A1 level. Participants will practice using the present simple tense to form basic sentences about daily activities and common situations.",
        sentencesCount: "20",
        data: '{"1kkyrnha-81f1-47e5-aec3-afff9810efe1":{"bg":"Аз съм в къщи.","en":"I am at home.","de":"Ich bin zu Hause."},"2kajrbgm-81f1-47e5-aec3-afff9810efe2":{"bg":"Той чете книга.","en":"He reads a book.","de":"Er liest ein Buch."},"3nalbrgn-81f1-47e5-aec3-afff9810efe3":{"bg":"Тя пише писмо.","en":"She writes a letter.","de":"Sie schreibt einen Brief."},"4jakbgtn-81f1-47e5-aec3-afff9810efe4":{"bg":"Ние пием кафе.","en":"We drink coffee.","de":"Wir trinken Kaffee."},"5najrbgn-81f1-47e5-aec3-afff9810efe5":{"bg":"Те играят футбол.","en":"They play football.","de":"Sie spielen Fußball."},"6balbgpn-81f1-47e5-aec3-afff9810efe6":{"bg":"Аз готвя вечеря.","en":"I cook dinner.","de":"Ich koche Abendessen."},"7lakrgnn-81f1-47e5-aec3-afff9810efe7":{"bg":"Той говори по телефона.","en":"He talks on the phone.","de":"Er spricht am Telefon."},"8jakrbgn-81f1-47e5-aec3-afff9810efe8":{"bg":"Тя учи английски.","en":"She studies English.","de":"Sie lernt Englisch."},"9makrbgn-81f1-47e5-aec3-afff9810efe9":{"bg":"Ние ходим на работа.","en":"We go to work.","de":"Wir gehen zur Arbeit."},"10jakrbgn-81f1-47e5-aec3-afff9810efea":{"bg":"Те купуват храна.","en":"They buy food.","de":"Sie kaufen Essen."},"11jakrbgm-81f1-47e5-aec3-afff9810efeb":{"bg":"Аз чета вестник.","en":"I read the newspaper.","de":"Ich lese die Zeitung."},"12makrbgn-81f1-47e5-aec3-afff9810efec":{"bg":"Той води кола.","en":"He drives a car.","de":"Er fährt ein Auto."},"13jakrbgn-81f1-47e5-aec3-afff9810efed":{"bg":"Тя слуша музика.","en":"She listens to music.","de":"Sie hört Musik."},"14jakrbgn-81f1-47e5-aec3-afff9810efee":{"bg":"Ние ядем в ресторант.","en":"We eat at a restaurant.","de":"Wir essen im Restaurant."},"15jakrbgn-81f1-47e5-aec3-afff9810efef":{"bg":"Те пишат съобщение.","en":"They write a message.","de":"Sie schreiben eine Nachricht."},"16jakrbgn-81f1-47e5-aec3-afff9810eff0":{"bg":"Аз отивам на училище.","en":"I go to school.","de":"Ich gehe zur Schule."},"17jakrbgn-81f1-47e5-aec3-afff9810eff1":{"bg":"Той почива в парка.","en":"He rests in the park.","de":"Er ruht sich im Park aus."},"18jakrbgn-81f1-47e5-aec3-afff9810eff2":{"bg":"Тя купува дрехи.","en":"She buys clothes.","de":"Sie kauft Kleidung."},"19jakrbgn-81f1-47e5-aec3-afff9810eff3":{"bg":"Ние пишем имейли.","en":"We write emails.","de":"Wir schreiben E-Mails."},"20jakrbgn-81f1-47e5-aec3-afff9810eff4":{"bg":"Те се срещат с приятели.","en":"They meet friends.","de":"Sie treffen Freunde."}}',
      },
      "34a1cab1-81f1-47e5-aec3-afff9810e002": {
        _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
        _createdOn: "1725876809111",
        title: "Past simple tense",
        level: "A1",
        description:
          "This training module is designed for beginners who wanted to learn a foreign language at the A1 level. Participants practiced using the past simple tense to form basic sentences about past activities and common situations.",
        sentencesCount: "20",
        data: '{"1a2b3c4d-81f1-47e5-aec3-afff9810efe1":{"bg":"Аз бях у дома.","en":"I was at home.","de":"Ich war zu Hause."},"2b3c4d5e-81f1-47e5-aec3-afff9810efe2":{"bg":"Той чете книга.","en":"He read a book.","de":"Er las ein Buch."},"3c4d5e6f-81f1-47e5-aec3-afff9810efe3":{"bg":"Тя написа писмо.","en":"She wrote a letter.","de":"Sie schrieb einen Brief."},"4d5e6f7g-81f1-47e5-aec3-afff9810efe4":{"bg":"Ние пихме кафе.","en":"We drank coffee.","de":"Wir tranken Kaffee."},"5e6f7g8h-81f1-47e5-aec3-afff9810efe5":{"bg":"Те играха футбол.","en":"They played football.","de":"Sie spielten Fußball."},"6f7g8h9i-81f1-47e5-aec3-afff9810efe6":{"bg":"Аз приготвих вечеря.","en":"I cooked dinner.","de":"Ich kochte Abendessen."},"7g8h9i0j-81f1-47e5-aec3-afff9810efe7":{"bg":"Той говореше по телефона.","en":"He talked on the phone.","de":"Er sprach am Telefon."},"8h9i0j1k-81f1-47e5-aec3-afff9810efe8":{"bg":"Тя учеше английски.","en":"She studied English.","de":"Sie lernte Englisch."},"9i0j1k2l-81f1-47e5-aec3-afff9810efe9":{"bg":"Ние ходихме на работа.","en":"We went to work.","de":"Wir gingen zur Arbeit."},"0j1k2l3m-81f1-47e5-aec3-afff9810efea":{"bg":"Те купиха храна.","en":"They bought food.","de":"Sie kauften Essen."},"1k2l3m4n-81f1-47e5-aec3-afff9810efeb":{"bg":"Аз четох вестник.","en":"I read the newspaper.","de":"Ich las die Zeitung."},"2l3m4n5o-81f1-47e5-aec3-afff9810efec":{"bg":"Той караше кола.","en":"He drove a car.","de":"Er fuhr ein Auto."},"3m4n5o6p-81f1-47e5-aec3-afff9810efed":{"bg":"Тя слушаше музика.","en":"She listened to music.","de":"Sie hörte Musik."},"4n5o6p7q-81f1-47e5-aec3-afff9810efee":{"bg":"Ние ядохме в ресторант.","en":"We ate at a restaurant.","de":"Wir aßen im Restaurant."},"5o6p7q8r-81f1-47e5-aec3-afff9810efef":{"bg":"Те написаха съобщение.","en":"They wrote a message.","de":"Sie schrieben eine Nachricht."},"6p7q8r9s-81f1-47e5-aec3-afff9810eff0":{"bg":"Аз отидох на училище.","en":"I went to school.","de":"Ich ging zur Schule."},"7q8r9s0t-81f1-47e5-aec3-afff9810eff1":{"bg":"Той почиваше в парка.","en":"He rested in the park.","de":"Er ruhte sich im Park aus."},"8r9s0t1u-81f1-47e5-aec3-afff9810eff2":{"bg":"Тя купи дрехи.","en":"She bought clothes.","de":"Sie kaufte Kleidung."},"9s0t1u2v-81f1-47e5-aec3-afff9810eff3":{"bg":"Ние написахме имейли.","en":"We wrote emails.","de":"Wir schrieben E-Mails."},"0t1u2v3w-81f1-47e5-aec3-afff9810eff4":{"bg":"Те се срещнаха с приятели.","en":"They met friends.","de":"Sie trafen Freunde."}}',
      },
      "34agtab1-81f1-47e5-aec3-afff9810e003": {
        _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
        _createdOn: "1725876457111",
        title: "Grammatical structures",
        level: "B1",
        description:
          "This training module helps learners practice using various tenses and grammatical structures at the B1 level. Participants will focus on applying past simple, present perfect, and future simple tenses through engaging exercises and real-life scenarios.",
        sentencesCount: "20",
        data: '{"a1b2c3d4-81f1-47e5-aec3-afff9810efe1":{"bg":"Миналата година завършихме важен проект в компанията.","en":"Last year, we completed an important project at the company.","de":"Letztes Jahr haben wir ein wichtiges Projekt in der Firma abgeschlossen."},"b2c3d4e5-81f1-47e5-aec3-afff9810efe2":{"bg":"Той е работил в различни международни компании.","en":"He has worked in various international companies.","de":"Er hat in verschiedenen internationalen Firmen gearbeitet."},"c3d4e5f6-81f1-47e5-aec3-afff9810efe3":{"bg":"Ще посетим новия музей следващата седмица.","en":"We will visit the new museum next week.","de":"Wir werden nächste Woche das neue Museum besuchen."},"d4e5f6g7-81f1-47e5-aec3-afff9810efe4":{"bg":"Аз пътувах до Париж миналото лято и видях много забележителности.","en":"I traveled to Paris last summer and saw many sights.","de":"Ich reiste letzten Sommer nach Paris und sah viele Sehenswürdigkeiten."},"e5f6g7h8-81f1-47e5-aec3-afff9810efe5":{"bg":"Тя учи испански от три години и говори много добре.","en":"She has been learning Spanish for three years and speaks very well.","de":"Sie lernt seit drei Jahren Spanisch und spricht sehr gut."},"f6g7h8i9-81f1-47e5-aec3-afff9810efe6":{"bg":"Ние обикновено ходим на фитнес три пъти седмично.","en":"We usually go to the gym three times a week.","de":"Wir gehen normalerweise dreimal pro Woche ins Fitnessstudio."},"g7h8i9j0-81f1-47e5-aec3-afff9810efe7":{"bg":"Той е завършил курса и сега има нова работа.","en":"He has completed the course and now has a new job.","de":"Er hat den Kurs abgeschlossen und hat jetzt einen neuen Job."},"h8i9j0k1-81f1-47e5-aec3-afff9810efe8":{"bg":"Тя не можеше да намери ключовете си вчера сутринта.","en":"She could not find her keys yesterday morning.","de":"Sie konnte ihre Schlüssel gestern Morgen nicht finden."},"i9j0k1l2-81f1-47e5-aec3-afff9810efe9":{"bg":"Ние сме били на тази конференция преди две години.","en":"We have been to that conference two years ago.","de":"Wir waren vor zwei Jahren auf dieser Konferenz."},"j0k1l2m3-81f1-47e5-aec3-afff9810efea":{"bg":"Той започна нова работа миналата седмица и се чувства много щастлив.","en":"He started a new job last week and feels very happy.","de":"Er hat letzte Woche einen neuen Job angefangen und fühlt sich sehr glücklich."},"k1l2m3n4-81f1-47e5-aec3-afff9810efeb":{"bg":"Тя е написала доклад и го е изпратила на своя ръководител.","en":"She has written a report and sent it to her supervisor.","de":"Sie hat einen Bericht geschrieben und ihn an ihren Vorgesetzten gesendet."},"l2m3n4o5-81f1-47e5-aec3-afff9810efec":{"bg":"Той планира да започне нов проект през следващия месец.","en":"He plans to start a new project next month.","de":"Er plant, nächsten Monat ein neues Projekt zu beginnen."},"m3n4o5p6-81f1-47e5-aec3-afff9810efed":{"bg":"Ние прекарахме много време на плажа миналото лято.","en":"We spent a lot of time at the beach last summer.","de":"Wir verbrachten letzten Sommer viel Zeit am Strand."},"n4o5p6q7-81f1-47e5-aec3-afff9810efee":{"bg":"Тя е посещавала курс по фотография, за да подобри уменията си.","en":"She has attended a photography course to improve her skills.","de":"Sie hat an einem Fotografie-Kurs teilgenommen, um ihre Fähigkeiten zu verbessern."},"o5p6q7r8-81f1-47e5-aec3-afff9810efef":{"bg":"Той ще се срещне с клиентите си следващата седмица.","en":"He will meet his clients next week.","de":"Er wird nächste Woche seine Kunden treffen."},"p6q7r8s9-81f1-47e5-aec3-afff9810eff0":{"bg":"Аз съм завършил университет преди пет години и сега работя като инженер.","en":"I graduated from university five years ago and now work as an engineer.","de":"Ich habe vor fünf Jahren die Universität abgeschlossen und arbeite jetzt als Ingenieur."},"q7r8s9t0-81f1-47e5-aec3-afff9810eff1":{"bg":"Тя посещаваше детската градина в този град, когато беше малка.","en":"She attended kindergarten in this city when she was little.","de":"Sie besuchte den Kindergarten in dieser Stadt, als sie klein war."},"r8s9t0u1-81f1-47e5-aec3-afff9810eff2":{"bg":"Ние сме се срещали много пъти през последните години.","en":"We have met many times over the past years.","de":"Wir haben uns in den letzten Jahren viele Male getroffen."},"s9t0u1v2-81f1-47e5-aec3-afff9810eff3":{"bg":"Той ще завърши курса до края на месеца.","en":"He will finish the course by the end of the month.","de":"Er wird den Kurs bis Ende des Monats abschließen."},"t0u1v2w3-81f1-47e5-aec3-afff9810eff4":{"bg":"Те са завършили много важни проекти през последните години.","en":"They have completed many important projects in recent years.","de":"Sie haben in den letzten Jahren viele wichtige Projekte abgeschlossen."}}',
      },
      "34a1cab1-81f1-47e5-aec3-afff9810e004": {
        _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
        _createdOn: "17215154649111",
        title: "Present Perfect Tense",
        level: "A2",
        description:
          "This training module is designed for learners at the A2 level who want to improve their understanding and use of the present perfect tense. Participants will practice forming sentences about experiences, actions that have relevance to the present, and life accomplishments.",
        sentencesCount: "20",
        data: '{"1kkyrnha-81f1-47e5-aec3-afff9810efe1":{"bg":"Аз съм бил в Италия.","en":"I have been to Italy.","de":"Ich bin in Italien gewesen."},"2kajrbgm-81f1-47e5-aec3-afff9810efe2":{"bg":"Тя е написала писмо.","en":"She has written a letter.","de":"Sie hat einen Brief geschrieben."},"3nalbrgn-81f1-47e5-aec3-afff9810efe3":{"bg":"Ние сме се срещали преди.","en":"We have met before.","de":"Wir haben uns schon einmal getroffen."},"4jakbgtn-81f1-47e5-aec3-afff9810efe4":{"bg":"Той е завършил задачата.","en":"He has finished the task.","de":"Er hat die Aufgabe beendet."},"5najrbgn-81f1-47e5-aec3-afff9810efe5":{"bg":"Те са купили нова къща.","en":"They have bought a new house.","de":"Sie haben ein neues Haus gekauft."},"6balbgpn-81f1-47e5-aec3-afff9810efe6":{"bg":"Аз съм чела тази книга.","en":"I have read this book.","de":"Ich habe dieses Buch gelesen."},"7lakrgnn-81f1-47e5-aec3-afff9810efe7":{"bg":"Той е гледал този филм.","en":"He has watched this movie.","de":"Er hat diesen Film gesehen."},"8jakrbgn-81f1-47e5-aec3-afff9810efe8":{"bg":"Тя е изучавала английски език.","en":"She has studied English.","de":"Sie hat Englisch studiert."},"9makrbgn-81f1-47e5-aec3-afff9810efe9":{"bg":"Ние сме живели тук от две години.","en":"We have lived here for two years.","de":"Wir wohnen hier seit zwei Jahren."},"10jakrbgn-81f1-47e5-aec3-afff9810efea":{"bg":"Те са направили план.","en":"They have made a plan.","de":"Sie haben einen Plan gemacht."},"11jakrbgm-81f1-47e5-aec3-afff9810efeb":{"bg":"Аз съм бил на този концерт.","en":"I have been to that concert.","de":"Ich war auf diesem Konzert."},"12makrbgn-81f1-47e5-aec3-afff9810efec":{"bg":"Той е загубил ключовете си.","en":"He has lost his keys.","de":"Er hat seine Schlüssel verloren."},"13jakrbgn-81f1-47e5-aec3-afff9810efed":{"bg":"Тя е видяла тази картина.","en":"She has seen this painting.","de":"Sie hat dieses Gemälde gesehen."},"14jakrbgn-81f1-47e5-aec3-afff9810efee":{"bg":"Ние сме се срещнали с новите съседи.","en":"We have met the new neighbors.","de":"Wir haben die neuen Nachbarn getroffen."},"15jakrbgn-81f1-47e5-aec3-afff9810efef":{"bg":"Те са ходили на почивка в Испания.","en":"They have gone on vacation to Spain.","de":"Sie sind in den Urlaub nach Spanien gegangen."},"16jakrbgn-81f1-47e5-aec3-afff9810eff0":{"bg":"Аз съм яла суши.","en":"I have eaten sushi.","de":"Ich habe Sushi gegessen."},"17jakrbgn-81f1-47e5-aec3-afff9810eff1":{"bg":"Той е завършил университет.","en":"He has graduated from university.","de":"Er hat die Universität abgeschlossen."},"18jakrbgn-81f1-47e5-aec3-afff9810eff2":{"bg":"Тя е изминала този маршрут преди.","en":"She has taken this route before.","de":"Sie ist diesen Weg schon einmal gegangen."},"19jakrbgn-81f1-47e5-aec3-afff9810eff3":{"bg":"Ние сме чули новината.","en":"We have heard the news.","de":"Wir haben die Nachrichten gehört."},"20jakrbgn-81f1-47e5-aec3-afff9810eff4":{"bg":"Те са продали стария си автомобил.","en":"They have sold their old car.","de":"Sie haben ihr altes Auto verkauft."}}',
      },
      "34a1cab1-81f1-47e5-aec3-afff9810e005": {
        _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
        _createdOn: "17215154649111",
        title: "Present Simple Questions",
        level: "A1",
        description:
          "This training module is designed for beginners at the A1 level to practice forming and understanding basic questions in the present simple tense. Participants will learn how to ask about habits, routines, and preferences.",
        sentencesCount: "20",
        data: '{"1kkyrnha-81f1-47e5-aec3-afff9810efe1":{"bg":"Къде живееш?","en":"Where do you live?","de":"Wo wohnst du?"},"2kajrbgm-81f1-47e5-aec3-afff9810efe2":{"bg":"Какво работиш?","en":"What do you do?","de":"Was machst du beruflich?"},"3nalbrgn-81f1-47e5-aec3-afff9810efe3":{"bg":"Той ходи ли на училище?","en":"Does he go to school?","de":"Geht er zur Schule?"},"4jakbgtn-81f1-47e5-aec3-afff9810efe4":{"bg":"Какво обичаш да ядеш?","en":"What do you like to eat?","de":"Was isst du gerne?"},"5najrbgn-81f1-47e5-aec3-afff9810efe5":{"bg":"Те говорят ли английски?","en":"Do they speak English?","de":"Sprechen sie Englisch?"},"6balbgpn-81f1-47e5-aec3-afff9810efe6":{"bg":"Колко често тренираш?","en":"How often do you exercise?","de":"Wie oft trainierst du?"},"7lakrgnn-81f1-47e5-aec3-afff9810efe7":{"bg":"Той играе ли футбол?","en":"Does he play football?","de":"Spielt er Fußball?"},"8jakrbgn-81f1-47e5-aec3-afff9810efe8":{"bg":"Какво обичаш да четеш?","en":"What do you like to read?","de":"Was liest du gerne?"},"9makrbgn-81f1-47e5-aec3-afff9810efe9":{"bg":"Къде работят твоите родители?","en":"Where do your parents work?","de":"Wo arbeiten deine Eltern?"},"10jakrbgn-81f1-47e5-aec3-afff9810efea":{"bg":"Тя свири ли на пиано?","en":"Does she play the piano?","de":"Spielt sie Klavier?"},"11jakrbgm-81f1-47e5-aec3-afff9810efeb":{"bg":"Какъв е твоят любим спорт?","en":"What is your favorite sport?","de":"Was ist dein Lieblingssport?"},"12makrbgn-81f1-47e5-aec3-afff9810efec":{"bg":"Какво време предпочиташ?","en":"What weather do you prefer?","de":"Welches Wetter magst du am liebsten?"},"13jakrbgn-81f1-47e5-aec3-afff9810efed":{"bg":"Тя ходи ли на работа с кола?","en":"Does she go to work by car?","de":"Fährt sie mit dem Auto zur Arbeit?"},"14jakrbgn-81f1-47e5-aec3-afff9810efee":{"bg":"Какво учиш?","en":"What do you study?","de":"Was studierst du?"},"15jakrbgn-81f1-47e5-aec3-afff9810efef":{"bg":"Кой е твоят любим цвят?","en":"What is your favorite color?","de":"Was ist deine Lieblingsfarbe?"},"16jakrbgn-81f1-47e5-aec3-afff9810eff0":{"bg":"Колко често четеш книги?","en":"How often do you read books?","de":"Wie oft liest du Bücher?"},"17jakrbgn-81f1-47e5-aec3-afff9810eff1":{"bg":"Те имат ли домашни любимци?","en":"Do they have pets?","de":"Haben sie Haustiere?"},"18jakrbgn-81f1-47e5-aec3-afff9810eff2":{"bg":"Кога започваш работа?","en":"When do you start work?","de":"Wann beginnst du mit der Arbeit?"},"19jakrbgn-81f1-47e5-aec3-afff9810eff3":{"bg":"Къде обикновено почиваш?","en":"Where do you usually vacation?","de":"Wo machst du normalerweise Urlaub?"},"20jakrbgn-81f1-47e5-aec3-afff9810eff4":{"bg":"Какво обичаш да готвиш?","en":"What do you like to cook?","de":"Was kochst du gerne?"}}',
      },
      "34a1cab1-81f1-47e5-aec3-afff9810e006": {
        _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
        _createdOn: "17215154649111",
        title: "Negative Sentences",
        level: "B1",
        description:
          "This training module is designed for learners at the B1 level to practice forming negative sentences in the present simple tense. Participants will practice using negative forms to talk about habits, routines, and preferences.",
        sentencesCount: "20",
        data: '{"1kkyrnha-81f1-47e5-aec3-afff9810efe1":{"bg":"Аз не говоря френски.","en":"I do not speak French.","de":"Ich spreche kein Französisch."},"2kajrbgm-81f1-47e5-aec3-afff9810efe2":{"bg":"Той не яде месо.","en":"He does not eat meat.","de":"Er isst kein Fleisch."},"3nalbrgn-81f1-47e5-aec3-afff9810efe3":{"bg":"Ние не ходим на фитнес.","en":"We do not go to the gym.","de":"Wir gehen nicht ins Fitnessstudio."},"4jakbgtn-81f1-47e5-aec3-afff9810efe4":{"bg":"Тя не пие кафе.","en":"She does not drink coffee.","de":"Sie trinkt keinen Kaffee."},"5najrbgn-81f1-47e5-aec3-afff9810efe5":{"bg":"Те не гледат телевизия.","en":"They do not watch TV.","de":"Sie sehen kein Fernsehen."},"6balbgpn-81f1-47e5-aec3-afff9810efe6":{"bg":"Аз не обичам зимата.","en":"I do not like winter.","de":"Ich mag den Winter nicht."},"7lakrgnn-81f1-47e5-aec3-afff9810efe7":{"bg":"Той не чете книги.","en":"He does not read books.","de":"Er liest keine Bücher."},"8jakrbgn-81f1-47e5-aec3-afff9810efe8":{"bg":"Ние не готвим често.","en":"We do not cook often.","de":"Wir kochen nicht oft."},"9makrbgn-81f1-47e5-aec3-afff9810efe9":{"bg":"Тя не пътува с влак.","en":"She does not travel by train.","de":"Sie fährt nicht mit dem Zug."},"10jakrbgn-81f1-47e5-aec3-afff9810efea":{"bg":"Те не ходят на кино.","en":"They do not go to the cinema.","de":"Sie gehen nicht ins Kino."},"11jakrbgm-81f1-47e5-aec3-afff9810efeb":{"bg":"Аз не ям сладкиши.","en":"I do not eat sweets.","de":"Ich esse keine Süßigkeiten."},"12makrbgn-81f1-47e5-aec3-afff9810efec":{"bg":"Той не плува в басейна.","en":"He does not swim in the pool.","de":"Er schwimmt nicht im Pool."},"13jakrbgn-81f1-47e5-aec3-afff9810efed":{"bg":"Тя не използва социални медии.","en":"She does not use social media.","de":"Sie nutzt keine sozialen Medien."},"14jakrbgn-81f1-47e5-aec3-afff9810efee":{"bg":"Ние не играем видео игри.","en":"We do not play video games.","de":"Wir spielen keine Videospiele."},"15jakrbgn-81f1-47e5-aec3-afff9810efef":{"bg":"Те не слушат класическа музика.","en":"They do not listen to classical music.","de":"Sie hören keine klassische Musik."},"16jakrbgn-81f1-47e5-aec3-afff9810eff0":{"bg":"Аз не правя йога.","en":"I do not do yoga.","de":"Ich mache kein Yoga."},"17jakrbgn-81f1-47e5-aec3-afff9810eff1":{"bg":"Той не кара колело.","en":"He does not ride a bike.","de":"Er fährt nicht Fahrrad."},"18jakrbgn-81f1-47e5-aec3-afff9810eff2":{"bg":"Тя не рисува картини.","en":"She does not paint pictures.","de":"Sie malt keine Bilder."},"19jakrbgn-81f1-47e5-aec3-afff9810eff3":{"bg":"Ние не пеем песни.","en":"We do not sing songs.","de":"Wir singen keine Lieder."},"20jakrbgn-81f1-47e5-aec3-afff9810eff4":{"bg":"Те не разбират немски.","en":"They do not understand German.","de":"Sie verstehen kein Deutsch."}}',
      },

      "34a1cab1-81f1-47e5-aec3-afff9810e007": {
        _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
        _createdOn: "17215154649111",
        title: "Future Simple Tense",
        level: "A1",
        description:
          "This training module is designed for beginners at the A1 level to learn how to form basic sentences in the future simple tense. Participants will practice talking about future plans and intentions.",
        sentencesCount: "20",
        data: '{"1kkyrnha-81f1-47e5-aec3-afff9810efe1":{"bg":"Аз ще отида на кино.","en":"I will go to the cinema.","de":"Ich werde ins Kino gehen."},"2kajrbgm-81f1-47e5-aec3-afff9810efe2":{"bg":"Той ще пътува утре.","en":"He will travel tomorrow.","de":"Er wird morgen reisen."},"3nalbrgn-81f1-47e5-aec3-afff9810efe3":{"bg":"Ние ще се срещнем в парка.","en":"We will meet in the park.","de":"Wir werden uns im Park treffen."},"4jakbgtn-81f1-47e5-aec3-afff9810efe4":{"bg":"Тя ще купи хляб.","en":"She will buy bread.","de":"Sie wird Brot kaufen."},"5najrbgn-81f1-47e5-aec3-afff9810efe5":{"bg":"Те ще играят футбол.","en":"They will play football.","de":"Sie werden Fußball spielen."},"6balbgpn-81f1-47e5-aec3-afff9810efe6":{"bg":"Аз ще уча английски.","en":"I will study English.","de":"Ich werde Englisch lernen."},"7lakrgnn-81f1-47e5-aec3-afff9810efe7":{"bg":"Той ще готви вечеря.","en":"He will cook dinner.","de":"Er wird das Abendessen kochen."},"8jakrbgn-81f1-47e5-aec3-afff9810efe8":{"bg":"Ние ще посетим музея.","en":"We will visit the museum.","de":"Wir werden das Museum besuchen."},"9makrbgn-81f1-47e5-aec3-afff9810efe9":{"bg":"Тя ще види приятелите си.","en":"She will see her friends.","de":"Sie wird ihre Freunde sehen."},"10jakrbgn-81f1-47e5-aec3-afff9810efea":{"bg":"Те ще играят шах.","en":"They will play chess.","de":"Sie werden Schach spielen."},"11jakrbgm-81f1-47e5-aec3-afff9810efeb":{"bg":"Аз ще отида на почивка.","en":"I will go on vacation.","de":"Ich werde in den Urlaub fahren."},"12makrbgn-81f1-47e5-aec3-afff9810efec":{"bg":"Той ще учи за изпита.","en":"He will study for the exam.","de":"Er wird für die Prüfung lernen."},"13jakrbgn-81f1-47e5-aec3-afff9810efed":{"bg":"Тя ще гледа телевизия.","en":"She will watch TV.","de":"Sie wird fernsehen."},"14jakrbgn-81f1-47e5-aec3-afff9810efee":{"bg":"Ние ще отидем на пазар.","en":"We will go shopping.","de":"Wir werden einkaufen gehen."},"15jakrbgn-81f1-47e5-aec3-afff9810efef":{"bg":"Те ще учат нови думи.","en":"They will learn new words.","de":"Sie werden neue Wörter lernen."},"16jakrbgn-81f1-47e5-aec3-afff9810eff0":{"bg":"Аз ще пиша имейл.","en":"I will write an email.","de":"Ich werde eine E-Mail schreiben."},"17jakrbgn-81f1-47e5-aec3-afff9810eff1":{"bg":"Той ще слуша музика.","en":"He will listen to music.","de":"Er wird Musik hören."},"18jakrbgn-81f1-47e5-aec3-afff9810eff2":{"bg":"Тя ще спортува.","en":"She will exercise.","de":"Sie wird Sport treiben."},"19jakrbgn-81f1-47e5-aec3-afff9810eff3":{"bg":"Ние ще се храним в ресторант.","en":"We will eat at a restaurant.","de":"Wir werden im Restaurant essen."},"20jakrbgn-81f1-47e5-aec3-afff9810eff4":{"bg":"Те ще работят в градината.","en":"They will work in the garden.","de":"Sie werden im Garten arbeiten."}}',
      },

      "34a1cab1-81f1-47e5-aec3-afff9810e008": {
        _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
        _createdOn: "17215154649112",
        title: "Future Simple Tense - A2",
        level: "A2",
        description:
          "This training module is designed for learners at the A2 level to improve their use of the future simple tense. Participants will practice forming sentences about future events, plans, and predictions.",
        sentencesCount: "20",
        data: '{"1kkyrnha-81f1-47e5-aec3-afff9810efe1":{"bg":"Аз ще участвам в маратона утре.","en":"I will participate in the marathon tomorrow.","de":"Ich werde morgen am Marathon teilnehmen."},"2kajrbgm-81f1-47e5-aec3-afff9810efe2":{"bg":"Те ще се преместят в нов апартамент следващия месец.","en":"They will move to a new apartment next month.","de":"Sie werden nächsten Monat in eine neue Wohnung umziehen."},"3nalbrgn-81f1-47e5-aec3-afff9810efe3":{"bg":"Тя ще завърши проекта си до края на седмицата.","en":"She will complete her project by the end of the week.","de":"Sie wird ihr Projekt bis Ende der Woche abschließen."},"4jakbgtn-81f1-47e5-aec3-afff9810efe4":{"bg":"Ние ще организираме партито тази събота.","en":"We will organize the party this Saturday.","de":"Wir werden die Party diesen Samstag organisieren."},"5najrbgn-81f1-47e5-aec3-afff9810efe5":{"bg":"Той ще посети Париж за първи път.","en":"He will visit Paris for the first time.","de":"Er wird Paris zum ersten Mal besuchen."},"6balbgpn-81f1-47e5-aec3-afff9810efe6":{"bg":"Аз ще науча нов език тази година.","en":"I will learn a new language this year.","de":"Ich werde dieses Jahr eine neue Sprache lernen."},"7lakrgnn-81f1-47e5-aec3-afff9810efe7":{"bg":"Тя ще започне нова работа следващия понеделник.","en":"She will start a new job next Monday.","de":"Sie wird nächsten Montag eine neue Stelle antreten."},"8jakrbgn-81f1-47e5-aec3-afff9810efe8":{"bg":"Ние ще направим резервация за вечеря в ресторанта.","en":"We will make a reservation for dinner at the restaurant.","de":"Wir werden eine Reservierung für das Abendessen im Restaurant machen."},"9makrbgn-81f1-47e5-aec3-afff9810efe9":{"bg":"Те ще отидат на почивка в Гърция това лято.","en":"They will go on vacation to Greece this summer.","de":"Sie werden diesen Sommer in Griechenland Urlaub machen."},"10jakrbgn-81f1-47e5-aec3-afff9810efea":{"bg":"Аз ще чета новата книга през уикенда.","en":"I will read the new book over the weekend.","de":"Ich werde das neue Buch am Wochenende lesen."},"11jakrbgm-81f1-47e5-aec3-afff9810efeb":{"bg":"Той ще работи върху нов проект в следващите няколко седмици.","en":"He will work on a new project in the next few weeks.","de":"Er wird in den nächsten Wochen an einem neuen Projekt arbeiten."},"12makrbgn-81f1-47e5-aec3-afff9810efec":{"bg":"Ние ще посетим баба и дядо през ваканцията.","en":"We will visit our grandparents during the vacation.","de":"Wir werden in den Ferien unsere Großeltern besuchen."},"13jakrbgn-81f1-47e5-aec3-afff9810efed":{"bg":"Тя ще подготви презентация за утрешната среща.","en":"She will prepare a presentation for tomorrow\'s meeting.","de":"Sie wird eine Präsentation für das morgige Treffen vorbereiten."},"14jakrbgn-81f1-47e5-aec3-afff9810efee":{"bg":"Те ще направят ремонт на къщата през пролетта.","en":"They will renovate the house in the spring.","de":"Sie werden das Haus im Frühjahr renovieren."},"15jakrbgn-81f1-47e5-aec3-afff9810efef":{"bg":"Аз ще гледам новия филм следващия уикенд.","en":"I will watch the new movie next weekend.","de":"Ich werde mir nächsten Samstag den neuen Film ansehen."},"16jakrbgn-81f1-47e5-aec3-afff9810eff0":{"bg":"Тя ще вземе участие в изложбата.","en":"She will participate in the exhibition.","de":"Sie wird an der Ausstellung teilnehmen."},"17jakrbgn-81f1-47e5-aec3-afff9810eff1":{"bg":"Ние ще готвим заедно на рождения му ден.","en":"We will cook together on his birthday.","de":"Wir werden an seinem Geburtstag gemeinsam kochen."},"18jakrbgn-81f1-47e5-aec3-afff9810eff2":{"bg":"Те ще пишат доклад по време на курса.","en":"They will write a report during the course.","de":"Sie werden während des Kurses einen Bericht schreiben."},"19jakrbgn-81f1-47e5-aec3-afff9810eff3":{"bg":"Аз ще се включа в доброволческата програма.","en":"I will join the volunteer program.","de":"Ich werde an dem Freiwilligenprogramm teilnehmen."},"20jakrbgn-81f1-47e5-aec3-afff9810eff4":{"bg":"Те ще организират събиране на семейството.","en":"They will organize a family reunion.","de":"Sie werden ein Familientreffen organisieren."}}',
      },

      "34a1cab1-81f1-47e5-aec3-afff9810e009": {
        _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
        _createdOn: "17215154649113",
        title: "Future Simple Tense - B1",
        level: "B1",
        description:
          "This training module is designed for learners at the B1 level to advance their use of the future simple tense. Participants will practice forming sentences about plans, predictions, and intentions for the future.",
        sentencesCount: "20",
        data: '{"1kkyrnha-81f1-47e5-aec3-afff9810efe1":{"bg":"Аз ще работя върху проект, който ще продължи шест месеца.","en":"I will work on a project that will last six months.","de":"Ich werde an einem Projekt arbeiten, das sechs Monate dauern wird."},"2kajrbgm-81f1-47e5-aec3-afff9810efe2":{"bg":"Те ще започнат нов бизнес, който ще се фокусира върху устойчивостта.","en":"They will start a new business that will focus on sustainability.","de":"Sie werden ein neues Geschäft gründen, das sich auf Nachhaltigkeit konzentrieren wird."},"3nalbrgn-81f1-47e5-aec3-afff9810efe3":{"bg":"Тя ще напише книга за своя опит в чужбина.","en":"She will write a book about her experiences abroad.","de":"Sie wird ein Buch über ihre Erfahrungen im Ausland schreiben."},"4jakbgtn-81f1-47e5-aec3-afff9810efe4":{"bg":"Ние ще инвестираме в технологични иновации през следващата година.","en":"We will invest in technological innovations next year.","de":"Wir werden nächstes Jahr in technologische Innovationen investieren."},"5najrbgn-81f1-47e5-aec3-afff9810efe5":{"bg":"Той ще завърши магистърска степен в областта на екологичните науки.","en":"He will complete a master\'s degree in environmental science.","de":"Er wird einen Master in Umweltwissenschaften abschließen."},"6balbgpn-81f1-47e5-aec3-afff9810efe6":{"bg":"Аз ще създам уебсайт, който ще помага на хората да научават нови езици.","en":"I will create a website that helps people learn new languages.","de":"Ich werde eine Website erstellen, die Menschen hilft, neue Sprachen zu lernen."},"7lakrgnn-81f1-47e5-aec3-afff9810efe7":{"bg":"Те ще проведат научно изследване по проблеми на климата.","en":"They will conduct scientific research on climate issues.","de":"Sie werden wissenschaftliche Forschungen zu Klimaproblemen durchführen."},"8jakrbgn-81f1-47e5-aec3-afff9810efe8":{"bg":"Тя ще организира благотворителна кампания за подпомагане на децата в нужда.","en":"She will organize a charity campaign to help children in need.","de":"Sie wird eine Wohltätigkeitskampagne organisieren, um bedürftigen Kindern zu helfen."},"9makrbgn-81f1-47e5-aec3-afff9810efe9":{"bg":"Ние ще участваме в международна конференция по въпроси на образованието.","en":"We will participate in an international conference on education issues.","de":"Wir werden an einer internationalen Konferenz zu Bildungsthemen teilnehmen."},"10jakrbgn-81f1-47e5-aec3-afff9810efea":{"bg":"Те ще представят своите изобретения на изложение за нови технологии.","en":"They will showcase their inventions at a new technology exhibition.","de":"Sie werden ihre Erfindungen auf einer Ausstellung für neue Technologien präsentieren."},"11jakrbgm-81f1-47e5-aec3-afff9810efeb":{"bg":"Аз ще се включа в програма за обмен на студенти в Азия.","en":"I will join a student exchange program in Asia.","de":"Ich werde an einem Studentenaustauschprogramm in Asien teilnehmen."},"12makrbgn-81f1-47e5-aec3-afff9810efec":{"bg":"Той ще започне да учи за докторска степен по литература.","en":"He will begin studying for a doctorate in literature.","de":"Er wird ein Studium für einen Doktortitel in Literatur beginnen."},"13jakrbgn-81f1-47e5-aec3-afff9810efed":{"bg":"Ние ще започнем нова инициатива за екологична осведоменост в нашата общност.","en":"We will launch a new environmental awareness initiative in our community.","de":"Wir werden eine neue Initiative zur Umweltbewusstseinsbildung in unserer Gemeinschaft starten."},"14jakrbgn-81f1-47e5-aec3-afff9810efee":{"bg":"Тя ще се обучава за пилот и ще получи лиценз.","en":"She will train to become a pilot and obtain a license.","de":"Sie wird sich zur Pilotin ausbilden lassen und eine Lizenz erwerben."},"15jakrbgn-81f1-47e5-aec3-afff9810efef":{"bg":"Те ще разработят ново приложение за подобряване на здравословния начин на живот.","en":"They will develop a new app to improve healthy living.","de":"Sie werden eine neue App zur Verbesserung eines gesunden Lebensstils entwickeln."},"16jakrbgn-81f1-47e5-aec3-afff9810eff0":{"bg":"Аз ще направя обиколка на европейските столици след завършването си.","en":"I will take a tour of European capitals after my graduation.","de":"Ich werde nach meinem Abschluss eine Tour durch die europäischen Hauptstädte machen."},"17jakrbgn-81f1-47e5-aec3-afff9810eff1":{"bg":"Те ще построят нова обществена библиотека в града.","en":"They will build a new public library in the city.","de":"Sie werden eine neue öffentliche Bibliothek in der Stadt bauen."},"18jakrbgn-81f1-47e5-aec3-afff9810eff2":{"bg":"Тя ще създаде организация за защита на животните.","en":"She will establish an organization for animal protection.","de":"Sie wird eine Organisation zum Schutz von Tieren gründen."},"19jakrbgn-81f1-47e5-aec3-afff9810eff3":{"bg":"Ние ще изучаваме влиянието на технологиите върху обществото.","en":"We will study the impact of technology on society.","de":"Wir werden die Auswirkungen der Technologie auf die Gesellschaft untersuchen."},"20jakrbgn-81f1-47e5-aec3-afff9810eff4":{"bg":"Те ще посрещнат експерти от различни сфери за обмен на опит.","en":"They will welcome experts from various fields for an exchange of experience.","de":"Sie werden Experten aus verschiedenen Bereichen zum Erfahrungsaustausch begrüßen."}}',
      },
    },
    learnedSentences: {},
  };
  var rules$1 = {
    users: {
      ".create": false,
      ".read": ["Owner"],
      ".update": false,
      ".delete": false,
    },
    members: {
      ".update": "isOwner(user, get('teams', data.teamId))",
      ".delete":
        "isOwner(user, get('teams', data.teamId)) || isOwner(user, data)",
      "*": {
        teamId: {
          ".update": "newData.teamId = data.teamId",
        },
        status: {
          ".create": "newData.status = 'pending'",
        },
      },
    },
  };
  var settings = {
    identity: identity,
    protectedData: protectedData,
    seedData: seedData,
    rules: rules$1,
  };

  const plugins = [
    storage(settings),
    auth(settings),
    util$2(),
    rules(settings),
  ];

  const server = http__default["default"].createServer(
    requestHandler(plugins, services)
  );

  const port = 3030;
  server.listen(port);
  console.log(
    `Server started on port ${port}. You can make requests to http://localhost:${port}/`
  );
  console.log(`Admin panel located at http://localhost:${port}/admin`);

  var softuniPracticeServer = {};

  return softuniPracticeServer;
});
