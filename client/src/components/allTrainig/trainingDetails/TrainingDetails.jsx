import { useContext, useEffect, useState } from 'react';
import { Context } from '../../context/Context';
import './TrainingDetails.css';
import { deleteTraining, getCurrentTraining } from '../../../services/units';
import { useParams, Link, useNavigate } from 'react-router-dom';

export function TrainingDetails(props) {
    const { contextData, setContextData } = useContext(Context);
    const [currentTrainingData, setCurrentTrainingData] = useState();
    const { currentTrainingId } = useParams();
    const isUser = Boolean(contextData.userData);
    let isOwner = Boolean(currentTrainingData && contextData.userData && currentTrainingData._ownerId === contextData.userData._id);
    const navigate = useNavigate();

    //get currentTrainingData
    useEffect(() => {
        const fetchFunction = async () => {
            try {
                props.loading(true);
                const currentTrainingData = await getCurrentTraining(currentTrainingId);
                if (currentTrainingData) {
                    setCurrentTrainingData(currentTrainingData);
                }
            } catch (error) {
                alert(error.message);
            }
            props.loading(false);
        }
        fetchFunction();
    }, []);

    async function deleteClickHandler(e) {
        try {
            await deleteTraining(currentTrainingData._id);
            navigate("/allTraining")
        } catch (error) {
            alert(error.message);
        }


    }

    if (currentTrainingData) {
        return (
            <>
                <h2>{currentTrainingData.title}</h2>
                <p>Level:{currentTrainingData.level}</p>
                <p>Number of items:{Object.keys(currentTrainingData.data).length}</p>
                <p>Description:{currentTrainingData.description}</p>
                {isOwner && <Link><button>Edit</button></Link>}
                {isOwner && <Link><button onClick={deleteClickHandler}>Delete</button></Link>}
                {isUser && <Link><button>Training</button></Link>}
            </>
        )
    } else {
        return null;
    }
}