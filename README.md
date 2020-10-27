<div style="text-align:center">
  
  <p align="middle">
    <img src="https://developer.nexmo.com/images/logos/vbc-logo.svg" height="43px" style="margin-right:10px" alt="Vonage" />
    <img src="https://aqicn.org/air/images/aqicnxl.png" height="48px" alt="AQICN" />
  </p>

  ![license](https://img.shields.io/github/license/sudiptog81/vonage-aqi?style=flat-square) ![dependencies](https://img.shields.io/david/sudiptog81/vonage-aqi?style=flat-square) ![contributors](https://img.shields.io/github/contributors/sudiptog81/vonage-aqi?style=flat-square)

</div>

## Features

* Replies with the detailed Air Quality Information sourced from the weather stations under the [World Air Quality Project](https://aqicn.org/).
* Supports WhatsApp and Messenger channels by leveraging the Messages API provided by Vonage.

## Usage

### WhatsApp

![whatsapp](./.github/assets/vonage-aqi-whatsapp.gif)

### Messenger

![messenger](./.github/assets/vonage-aqi-messenger.gif)

## Getting Started

* Register at [`https://dashboard.nexmo.com/`](https://dashboard.nexmo.com/) and go to the Messages API Sandbox. 
* Whitelist a test recipient by following the instructions for the WhatsApp channel and/or the Messenger channel.
* Note down the API Key and the API Secret as well as the Sandox Numbers and/or the Sandbox IDs.
* Clone this repository and install the required dependencies.
* Run the Express Application using `yarn start` and expose it with `ngrok` by executing `ngrok http <application-port>`.
* Set the Inbound Webhook Endpoint on the Messages API Sandbox.

## License

The MIT License
