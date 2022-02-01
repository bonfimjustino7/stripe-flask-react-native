import React, {useState} from 'react';
import {GooglePayButton, useGooglePay} from '@stripe/stripe-react-native';
import PaymentScreen from '../components/PaymentScreen';
import {API_URL} from '../Config';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {useCustomer} from '../context/customer';

export default function GooglePayScreen({navigation, route}) {
  const {
    initGooglePay,
    presentGooglePay,
    loading,
    createGooglePayPaymentMethod,
  } = useGooglePay();

  const [initialized, setInitialized] = useState(false);
  const {customer} = useCustomer();
  const [loadingRequest, setLoading] = useState(false);

  const fetchPaymentIntentClientSecret = async () => {
    const response = await fetch(`${API_URL}/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: route.params?.priceId,
        customer: customer.id,
      }),
    });
    const {clientSecret} = await response.json();

    return clientSecret;
  };

  const modifyPaymentMethod = async paymentMethodId => {
    const response = await fetch(`${API_URL}/subscription-modify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_method_id: paymentMethodId,
        subscription_id: route.params?.subscriptionId,
        customer_id: customer.id,
      }),
    });
    const responseData = await response.json();
    console.log(responseData);
    return responseData;
  };

  const cancelSubscription = async () => {
    setLoading(true);
    const response = await fetch(`${API_URL}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription_id: route.params?.subscriptionId,
      }),
    });

    await response.json();
    setLoading(false);

    Alert.alert('Assinatura Cancelada', 'Sua assinatura foi cancelada', [
      {text: 'OK', onPress: () => navigation.goBack()},
    ]);
  };

  const pay = async () => {
    // 2. Fetch payment intent client secret
    const clientSecret = await fetchPaymentIntentClientSecret();

    // 3. Open Google Pay sheet and proceed a payment
    const {error} = await presentGooglePay({
      clientSecret,
      forSetupIntent: false,
    });

    if (error) {
      Alert.alert(error.code, error.message);
      return;
    }
    Alert.alert('Success', 'The payment was confirmed successfully.');
    setInitialized(false);
  };

  /*
    As an alternative you can only create a paymentMethod instead of confirming the payment.
  */
  const createPaymentMethod = async () => {
    const {error, paymentMethod} = await createGooglePayPaymentMethod({
      amount: 50,
      currencyCode: 'BRL',
    });

    if (error) {
      Alert.alert(error.code, error.message);
      return;
    } else if (paymentMethod) {
      Alert.alert(
        'Success',
        `The payment method was created successfully. paymentMethodId: ${paymentMethod.id}`,
      );

      modifyPaymentMethod(paymentMethod.id);
    }
    setInitialized(false);
  };

  // 1. Initialize Google Pay
  const initialize = async () => {
    const {error} = await initGooglePay({
      testEnv: true,
      merchantName: 'Test',
      countryCode: 'US',
      billingAddressConfig: {
        format: 'FULL',
        isPhoneNumberRequired: true,
        isRequired: false,
      },
      existingPaymentMethodRequired: false,
      isEmailRequired: true,
    });

    if (error) {
      console.log(error);
      Alert.alert(error.code, error.message);
      return;
    }
    setInitialized(true);
  };

  return loadingRequest ? (
    <ActivityIndicator size="large" style={StyleSheet.absoluteFill} />
  ) : (
    <PaymentScreen onInit={initialize}>
      <Text style={styles.textHead}>
        {route.params?.name
          ? `Alterar meio de pagamento de ${customer.name}\nPlano: ${route.params?.name}`
          : 'Pague com o Google Pay ou cartão de crédito'}
      </Text>
      {/* <Text>{route.params?.priceId}</Text>
  <Text>{route.params?.product}</Text> */}
      <View style={styles.row}>
        {route.params?.subscriptionId ? (
          <>
            <GooglePayButton
              disabled={!initialized || loading}
              style={styles.standardButton}
              type="standard"
              onPress={createPaymentMethod}
            />
          </>
        ) : (
          <GooglePayButton
            disabled={!initialized || loading}
            style={styles.payButton}
            type="pay"
            onPress={pay}
          />
        )}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('PaymentWebView', {
              priceId: route.params?.priceId,
              subscriptionId: route.params?.subscriptionId,
            })
          }
          style={styles.buttonCard}>
          <Text style={styles.textButtonCard}>Cartão de Crédito</Text>
        </TouchableOpacity>
        {route.params?.subscriptionId && (
          <TouchableOpacity
            style={styles.buttonCancel}
            onPress={() => cancelSubscription()}>
            <Text style={styles.textButtonCancel}>Cancelar</Text>
          </TouchableOpacity>
        )}
        {/* <View style={styles.row}>
    <GooglePayButton
      disabled={!initialized || loading}
      style={styles.standardButton}
      type="standard"
      onPress={createPaymentMethod}
    />
  </View> */}
      </View>
    </PaymentScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 30,
  },
  payButton: {
    width: 152,
    height: 40,
  },
  standardButton: {
    width: 90,
    height: 40,
  },
  textHead: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonCard: {
    width: '40%',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 20,
  },
  buttonCancel: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 8,
    width: '40%',
    marginTop: 20,
  },
  textButtonCancel: {
    color: '#fff',
    textAlign: 'center',
  },
  textButtonCard: {
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
  },
});
