import * as React from 'react';

export interface IStatusOnlineProps {
    online: boolean|null;
}

export default function StatusOnline(props: IStatusOnlineProps) {
    const component =React.useMemo(() => {
        return <div>{props.online?<div className="back-online">Back online</div>:<div className="offline"> Offline</div>}</div>;
      }, [props.online]);
    return component;
}