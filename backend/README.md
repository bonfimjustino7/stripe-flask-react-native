## Backend Python Flask


Instalação:
 
 1. Criação da venv `virtualenv --python=python3.6 venv`
 2. Ativação `. venv/bin/activate`
 3. Instalação das dependências  `pip install -r requirements.txt`
 4. Criação do .env na pasta raiz contendo as seguintes chaves:
	 4.1. STRIPE_SECRET_KEY
	 4.2. STRIPE_API_VERSION 
	 4.3. STRIPE_PUBLISHABLE_KEY
	 *obs: estas informações são encontradas no dashboard da stripe (https://dashboard.stripe.com/test/apikeys)
