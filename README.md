# Microsoft Teams Integration of DialogFlow bots

Over time, many bots have been developed using DialogFlow framework from Google. Many of those who developed those bots would like to integrate them with Microsoft Teams. However, Google does not offer such integration scenario as of 2022, so this repo contains a viable approach in overcoming this gap.

In this document I will therefore outline the procedure to follow to integrate [DialogFlow](https://dialogflow.cloud.google.com/) with [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams/log-in), through the usage of [Microsoft Azure Bot](https://azure.microsoft.com/en-us/services/bot-services/).

Full code is also shared in this repo. Code was basically copied and adapted from [this code](https://github.com/GoogleCloudPlatform/dialogflow-integrations/tree/master/skype) also using knowledge from the comments inside [this Github issue](https://github.com/GoogleCloudPlatform/dialogflow-integrations/issues/43).

## Design

Our users will use Microsoft Teams as the primary interface to talk with the bot. The bot will run on DialogFlow, and will use the Azure Bot from Microsoft to be able to receive commands and send responses to Teams.

In a picture, this is our target setup:

![High level architectural overview](/images/schema.png)

## Setup

### Prerequisites

To proceed, you will first of all need an account on [Microsoft Azure](https://azure.microsoft.com/en-us/pricing/free-services/) and one on [Google Cloud Platform](https://cloud.google.com/free). If you don't have any, go and grab one, each cloud provider has its own flavor of free offering.

You also need a Microsoft 365 (M365) tenant, be it demo or not. You can create one for developers [here](https://developer.microsoft.com/en-us/microsoft-365/dev-program), which should be enough to test out our scenario.

### GCP-side

For our setup to work, we need to start from GCP. In Google we will deploy:

- a project, which we will call `demodialogflowteams` (this will be our project-id)
- a DialogFlow resource, called `demodialogflowteams`, which will have a couple of intents (just to show)
- a Google Cloud Function, which will be our consumption-based bot that will be triggered by user chats and which will connect to Teams through Azure Bot

So, there we go. First, we create the project and enable some APIs, such as:

- Cloud Build API
- Cloud Functions API
- DialogFlow API

We will also create a Service Account for our Google Cloud Function to run. Our will be `demodialogflowteams@demodialogflowteams.iam.gserviceaccount.com`. We will download its JSON and set the following environmental variable in our shell:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=demodialogflowteams-86d9a1614595.json
```

where `demodialogflowteams-86d9a1614595.json` is the path to our key file.

After that, in DialogFlow console we create a new project (`demodialogflowteams`) and add the following intents:

- `TEAMS_WELCOME` (an intent that will be used to welcome new users, you can put in a standard "Hello" response)
- `Who are you` intent (which we will populate with standard phrases along with answers - see screenshot below)

![DialogFlow intents](/images/intents.png)

![DialogFlow "Who are you" intent phrases detail](/images/intent_whoareyou.png)

![DialogFlow "Who are you" intent response detail](/images/intent_whoareyou2.png)

That's it on GCP's side. Before deploying our Cloud Function, let's go and create Azure-side resources.

### Azure-side

We will need to create a resource-group in Azure, which we will call `rg-dialogflow-bot-teams`, and in that resource group we will create an Azure Bot resource.

![Resource group](/images/rg.png)

Our bot, in particular, will be configured as "Single Tenant" and we will let Azure control plane create our own Azure AD App Registration:

![Bot creation details](/images/bot_creation_details.png)

We will then take care of the AppID and tenant ID by getting them here:

![Bot configuration details](/images/bot_details.png)

and here in the KeyVault we will retrieve our AppSecret (you might need to add an access policy for yourself to do this from the portal):

![AppSecret from KeyVault](/images/keyvault_secret.png)

Then, we will enable the "Microsoft Teams channel" in our Azure bot we just created:

![Enable MS Teams channel in Azure Bot](/images/teams_channel.png)

## Deploy

The final step is deploying the Google Cloud Function in GCP and getting its URL in order to configure the Azure Bot, so that they know how to talk.

Let's deploy the function with this command, to which we will need to pass our AppId, AppSecret and Azure tenant ID:

```bash
gcloud functions deploy demodialogflowteams \
    --runtime nodejs12 \
    --service-account=demodialogflowteams@demodialogflowteams.iam.gserviceaccount.com \
    --entry-point app \
    --trigger-http \
    --set-env-vars GOOGLE_PROJECT_ID="demodialogflowteams",MICROSOFT_APP_ID=$MICROSOFT_APP_ID,MICROSOFT_APP_PASSWORD=$MICROSOFT_APP_PASSWORD,MICROSOFT_TENANT_ID=$MICROSOFT_TENANT_ID
```

(of course, you will have to modify placeholder variables)

Take note of the Google Function URL endpoint we create, because we will have to insert back into Azure Bot service, in the first slot:

![Bot configuration details](/images/bot_details2.png)

## Test the bot

A Teams bot has to be deployed in Teams. Since this is a standard procedure, I will let you do it by following [the instructions](https://microsoft.github.io/botframework-solutions/clients-and-channels/tutorials/enable-teams/4-create-app-manifest/).

To conclude the demo, without having to install anything on our M365 tenant, we will simply use the link we find here:

![Open in Microsoft Teams](/images/open_in_teams.png)

and after clicking "Open in Teams" we will land in a chat with our bot, where we will be able to ask questions and send commands to DialogFlow:

![Teams chat with our DialogFlow bot](/images/dialogflow_teams_bot.png)

The magic is done: multicloud bot works, the response you see above in Teams was one that we inserted as a response to our intent "Who are you" in DialogFlow.

For more information and details, please just have a look at code in the repo.

## Security considerations

Finally, a security consideration: our function is publicly accessible, having a public endpoint; also, it does not require any kind of authentication whatsoever.

In a real world scenario, you want to add authentication so that your function requires a valid user before proceeding, and after authentication token is valided you can proceed with responding to your user.

For information on how to configure Azure Bot service in order to use OAuth2 authentication, please refer to [this official document](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-authentication) and modify your code accordingly: since it does not depend on DialogFlow-Teams integration, I'll leave it here as a remark.
