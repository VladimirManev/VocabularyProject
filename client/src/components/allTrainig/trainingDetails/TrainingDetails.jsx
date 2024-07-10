import { useContext, useEffect, useState } from 'react';
import { Context } from '../../context/Context';
import './TrainingDetails.css';
import { getCurrentTraining } from '../../../services/units';
import { useParams } from 'react-router-dom';

export function TrainingDetails(props) {
    const { contextData, setContextData } = useContext(Context);
    const [currentTrainingData, setCurrentTrainingData] = useState();
    const { id } = useParams();

    //get currentTrainingData
    useEffect(() => {
        const fetchFunction = async () => {
            try {
                props.loading(true);
                const currentTrainingData = await getCurrentTraining(id);
                if (currentTrainingData) {
                    setCurrentTrainingData(currentTrainingData);
                }
            } catch (error) {
                alert(error);
            }
            props.loading(false);
        }
        fetchFunction();
    }, [])

    console.log(currentTrainingData);
    if (currentTrainingData) {
        return (
            <>
                <h2>{currentTrainingData.title}</h2>
                <p>Level:{currentTrainingData.level}</p>
                <p>Number of items:{Object.keys(currentTrainingData.data).length}</p>
                <p>Description:{currentTrainingData.description}</p>
            </>
        )
    } else {
        return null;
    }
}