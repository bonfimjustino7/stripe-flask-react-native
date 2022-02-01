import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import {StackRouter} from './routes';

function App() {
  return (
    <NavigationContainer>
      <StackRouter />
    </NavigationContainer>
  );
}

export default App;
