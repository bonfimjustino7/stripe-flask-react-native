import {Alert} from 'react-native';
import {API_URL} from './Config';

export async function fetchPublishableKey(paymentMethod) {
  try {
    const response = await fetch(
      `${API_URL}/stripe-key?paymentMethod=${paymentMethod}`,
    );

    const {publishableKey} = await response.json();

    return publishableKey;
  } catch (e) {
    console.log(e);
    console.warn('Unable to fetch publishable key. Is your server running?');
    Alert.alert(
      'Error',
      'Unable to fetch publishable key. Is your server running?',
    );
    return null;
  }
}
