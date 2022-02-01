#! /usr/bin/env python3.6

"""
server.py
Stripe Sample.
Python 3.6 or newer required.
"""

import stripe
import json
import os

from flask import Flask, render_template, jsonify, request, redirect
from dotenv import load_dotenv, find_dotenv

# Setup Stripe python client library
load_dotenv(find_dotenv())
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
stripe.api_version = os.getenv('STRIPE_API_VERSION')

app = Flask(__name__)


@app.route('/create-customer', methods=['POST'])
def create_customer():
    # Reads application/json and returns a response
    data = json.loads(request.data)
    try:
        # Create a new customer object
        customer = stripe.Customer.create(
            email=data['email'], name=data['name'])

        # At this point, associate the ID of the Customer object with your
        # own internal representation of a customer, if you have one.
        resp = jsonify(customer=customer)

        # We're simulating authentication here by storing the ID of the customer
        # in a cookie.
        resp.set_cookie('customer', customer.id)

        return resp
    except Exception as e:
        return jsonify(error=str(e)), 403


@app.route('/config', methods=['GET'])
def get_config():
    # Retrieves two prices with the lookup_keys
    # `sample_basic` and `sample_premium`.  To
    # create these prices, you can use the Stripe
    # CLI fixtures command with the supplied
    # `seed.json` fixture file like so:
    #
    #    stripe fixtures seed.json
    #

    prices = stripe.Price.list()
    customers = stripe.Customer.list()

    return jsonify(
        publishableKey=os.getenv('STRIPE_PUBLISHABLE_KEY'),
        prices=prices.data,
        customers=customers.data
    )


@app.route('/create-subscription', methods=['POST'])
def create_subscription():
    data = json.loads(request.data)

    # Simulating authenticated user. Lookup the logged in user in your
    # database, and set customer_id to the Stripe Customer ID of that user.
    # customer_id = request.cookies.get('customer')

    # Extract the price ID from environment variables given the name
    # of the price passed from the front end.
    #
    # `price_id` is the an ID of a Price object on your account.
    # This was populated using Price's `lookup_key` in the /config endpoint
    price_id = data['price_id']

    try:
        # Create the subscription. Note we're using
        # expand here so that the API will return the Subscription's related
        # latest invoice, and that latest invoice's payment_intent
        # so we can collect payment information and confirm the payment on the front end.

        # Create the subscription
        subscription = stripe.Subscription.create(
            customer=data['customer'],
            items=[{
                'price': price_id,
            }],
            payment_behavior='default_incomplete',
            expand=['latest_invoice.payment_intent'],
        )
        return jsonify(subscriptionId=subscription.id, clientSecret=subscription.latest_invoice.payment_intent.client_secret)

    except Exception as e:
        return jsonify(error={'message': e.user_message}), 400


# def calculate_order_amount(items):
#     # Replace this constant with a calculation of the order's amount
#     # Calculate the order total on the server to prevent
#     # people from directly manipulating the amount on the client
#     return 1400


@app.route('/stripe-key')
def get_keys():
    return jsonify({'publishableKey': os.getenv('STRIPE_PUBLISHABLE_KEY')})


# @app.route('/create-payment-intent', methods=['POST'])
# def create_payment():
#     data = json.loads(request.data)
#     # Create a PaymentIntent with the order amount and currency
#     intent = stripe.PaymentIntent.create(
#         amount=calculate_order_amount(data['items']),
#         currency=data['currency']
#     )

#     try:
#         # Send publishable key and PaymentIntent details to client
#         return jsonify({'publishableKey': os.getenv('STRIPE_PUBLISHABLE_KEY'), 'clientSecret': intent.client_secret})
#     except Exception as e:
#         return jsonify(error=str(e)), 403


@app.route('/webhook', methods=['POST'])
def webhook_received():
    # You can use webhooks to receive information about asynchronous payment events.
    # For more about our webhook events check out https://stripe.com/docs/webhooks.
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    request_data = json.loads(request.data)

    if webhook_secret:
        # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
        signature = request.headers.get('stripe-signature')
        try:
            event = stripe.Webhook.construct_event(
                payload=request.data, sig_header=signature, secret=webhook_secret)
            data = event['data']
        except Exception as e:
            return e
        # Get the type of webhook event sent - used to check the status of PaymentIntents.
        event_type = event['type']
    else:
        data = request_data['data']
        event_type = request_data['type']
    data_object = data['object']

    if event_type == 'payment_intent.succeeded':
        print('💰 Payment received!')
        # Fulfill any orders, e-mail receipts, etc
        # To cancel the payment you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    elif event_type == 'payment_intent.payment_failed':
        print('❌ Payment failed.')
    return jsonify({'status': 'success'})


@app.route('/create-checkout-session', methods=['GET'])
def create_checkout_session():
    price_id = request.args.get('price_id')
    customer = request.args.get('customer')

    session = stripe.checkout.Session.create(
        line_items=[{
            'price': price_id,
            'quantity': 1,
        }],
        mode='subscription',
        customer=customer,
        success_url='http://0.0.0.0:5000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url='https://example.com/cancel',
    )

    return redirect(session.url, code=303)


@app.route('/success', methods=['GET'])
def success():
    id = request.args.get('session_id')
    retrive = stripe.checkout.Session.retrieve(id)

    return jsonify(retrive)


@app.route('/modify-checkout-session', methods=['GET'])
def modify_checkout_session():

    data = request.args

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        setup_intent_data={
            'metadata': {
                'subscription_id': data['subscription_id'],
            },
        },
        mode='setup',
        customer=data['customer'],
        success_url='http://localhost:5000/success-modify-checkout-session?session_id={CHECKOUT_SESSION_ID}',
        cancel_url='https://example.com/cancel',
    )

    return redirect(session.url, code=303)


@app.route('/success-modify-checkout-session', methods=['GET'])
def success_modify_checkout_session():
    id = request.args.get('session_id')

    session = stripe.checkout.Session.retrieve(id)

    setup_intent_id = session.get('setup_intent')

    setup_itent = stripe.SetupIntent.retrieve(setup_intent_id)

    payment_menthod = setup_itent['payment_method']

    stripe.PaymentMethod.attach(
        payment_menthod,
        customer=session['customer'],
    )

    customer = stripe.Customer.modify(
        session['customer'],
        invoice_settings={"default_payment_method": payment_menthod},
    )

    sub = stripe.Subscription.modify(
        setup_itent['metadata']['subscription_id'],
        default_payment_method=payment_menthod
    )

    return jsonify(result='Modify Customer Success')


@app.route('/subscription/<subscription_id>', methods=['GET'])
def subscription(subscription_id):
    data = stripe.Subscription.retrieve(
        subscription_id)

    return jsonify(data)


# @app.route('/customer', methods=['GET'])
# def customer():
#     customer_id = request.args.get('customerId')
#     customer_data = stripe.Customer.retrieve(customer_id)
#     return jsonify(customer_data)


@app.route('/customer/<customer_id>/subscriptions', methods=['GET'])
def customer_subscriptions(customer_id):
    subscriptions = stripe.Subscription.list(
        customer=customer_id,
        expand=['data.items.data.plan', 'data.plan.product']
    )
    return jsonify(subscriptions)


@app.route('/plans', methods=['GET'])
def plans():
    return jsonify(stripe.Plan.list(expand=['data.product']))


# @app.route('/remove-payment', methods=['POST'])
# def remove_payment_default():
#     paymentMethodId = 'pm_1KMHj8Ap2QFYC8IsmoO3fuPr'

#     response = stripe.PaymentMethod.detach(
#         paymentMethodId,
#     )

#     return jsonify(response)


# @app.route('/customer-modify', methods=['POST'])
# def customer_modify():
#     data = json.loads(request.data)
#     try:

#         stripe.PaymentMethod.attach(
#             data['payment_method_id'],
#             customer=data['customerId'],
#         )

#         # Set the default payment method on the customer
#         response = stripe.Customer.modify(
#             data['customerId'],
#             invoice_settings={
#                 'default_payment_method': data['payment_method_id'],
#             },
#         )

#         # # Create the subscription
#         # subscription = stripe.Subscription.create(
#         #     customer=data['customerId'],
#         #     items=[
#         #         {
#         #             'price': os.getenv(data['priceId'])
#         #         }
#         #     ],
#         #     expand=['latest_invoice.payment_intent', 'pending_setup_intent'],
#         # )
#         return jsonify(response)
#     except Exception as e:
#         print(str(e))
#         return jsonify(error={'message': str(e)}), 200


@app.route('/subscription-modify', methods=['POST'])
def subscription_modify():
    data = json.loads(request.data)

    try:
        stripe.PaymentMethod.attach(
            data['payment_method_id'],
            customer=data['customer_id'],
        )

        sub = stripe.Subscription.modify(
            data['subscription_id'],
            default_payment_method=data['payment_method_id']

        )

        return jsonify(sub)

    except Exception as e:
        return jsonify(error={'message': str(e)}), 400


@app.route('/cancel-subscription', methods=['POST'])
def cancel_subscription():
    data = json.loads(request.data)

    try:
        stripe.Subscription.delete(data['subscription_id'])

        return jsonify(detail="Subscription Cancelled")

    except Exception as e:
        return jsonify(error=str(e)), 400


if __name__ == '__main__':
    app.run()
