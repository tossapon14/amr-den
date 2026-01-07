import Network  from '../assets/images/network_error.png';

function NetworkError() {

  return <div className="d-flex align-items-center w-100 flex-column justify-content-center text-center mt-5">
    <img src={Network} alt="Network Error" style={{ maxWidth: '120px', height: 'auto' }} />
    <div className="text-center">
      <h3 className='my-2'>Network Error</h3>
      <p style={{fontSize:'1rem',color:'rgb(189, 189, 189)'}}>Please check your internet connection and try again.</p>
    </div>
    <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
  </div>;
}

export default NetworkError;