import React from 'react';
import {WebView} from 'react-native-webview';
import {API_URL} from '../Config';
import {useCustomer} from '../context/customer';

export default function PaymentWebView({navigation, route}) {
  const {customer} = useCustomer();

  const customerId = customer.id;
  const priceId = route.params?.priceId;
  const subscriptionId = route.params?.subscriptionId;

  const uri = priceId
    ? `${API_URL}/create-checkout-session?price_id=${priceId}&customer=${customerId}`
    : `${API_URL}/modify-checkout-session?subscription_id=${subscriptionId}&customer=${customerId}`;

  return (
    <WebView
      source={{
        uri,
      }}
    />
  );
}
