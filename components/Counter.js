import { useState } from 'react';

export default function Counter({ title }) {
  const [count, setCount] = useState(0);

  return (
    <div style={{ border: '1px solid gray', padding: '1rem', margin: '1rem' }}>
      <h2>{title}</h2>
      <p>Current Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
