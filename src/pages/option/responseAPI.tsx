import { useEffect, useState } from 'react';
import { BiSolidError } from "react-icons/bi";
import { FaRegCircleCheck } from "react-icons/fa6";
interface ResponseAPIProps {
    response: {
        error: boolean|null,message?: string
    }
}
export default function ResponseAPI({ response }: ResponseAPIProps) {
    const [showResponse, setShowResponse] = useState(false);
    useEffect(() => {
       
        if (response.error!=null) { 
            setShowResponse(true);    
            setTimeout(() => {
                setShowResponse(false);
            }, 3100);
        }else if(response.error == null&&response.message === 'loading'){
            setShowResponse(true);
        }
    }, [response]);
    return (<>
        {showResponse && <div>
            {response.error != null ? <div>
                {response.error ? <div className='show-response-error'>
                    <BiSolidError size={54} color='#f44336' />
                    <h5 className='ms-3'>{response.message || 'Unknown Error'}</h5>
                </div> : <div className='show-response'>
                    <FaRegCircleCheck size={54} color='#00ff5a' />
                    <h5 className='ms-3'>{response.message}</h5>
                </div>}
            </div> : <div className='show-response-loading'>
                <div id='loading2'></div>
            </div>}
        </div>}

    </>

    );
}