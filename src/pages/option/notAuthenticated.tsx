export default function NotAuthenticated() {

    return (<div className="authDiaload-bg">
        <dialog id="authDialog" open={true}>
            <div className="dialog-header">Not Authenticated</div>
            <div className="dialog-body">
                You must be logged in to access this feature. Please sign in and try again.
            </div>
            <div className="dialog-footer">
                <button onClick={() => window.location.href = '/login'}>OK</button>
            </div>
        </dialog>
    </div>)
}