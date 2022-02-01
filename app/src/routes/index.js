import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PlanAvaibles from '../screens/PlansAvaibles';
import PayementScreen from '../screens/PayementScreen';
import PaymentWebView from '../screens/PaymentWebView';

const Stack = createNativeStackNavigator();

export function StackRouter() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PlanList" component={PlanAvaibles} />
      <Stack.Screen name="Payment" component={PayementScreen} />
      <Stack.Screen name="PaymentWebView" component={PaymentWebView} />

      {/* <Stack.Screen name="GooglePay" component={Notifications} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Settings" component={Settings} /> */}
    </Stack.Navigator>
  );
}
