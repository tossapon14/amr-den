import React, { useState  } from 'react';

// Define an interface for the component's props for type safety
interface AppProps {
  title: string;
}

// Use React.FC (FunctionComponent) type for the component
const Alarm  = () => {
  // Define state with an explicit type argument
//   const [count, setCount] = useState<number>(0);

//   const increment = () => {
//     setCount(count + 1);
//   };

  return (
    <div>
      <h1>{1}</h1>
      <p>Current count: {2}</p>
      <button  >Increment</button>
      <p>This is an example of a React page using TypeScript.</p>
    </div>
  );
};

export default Alarm;