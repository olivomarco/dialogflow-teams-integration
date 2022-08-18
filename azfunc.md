# Azure Functions add-on

First, create a function on the portal.

Then run:

```bash
TARGET_NAME=azfunc
npm install -g azure-functions-core-tools@4 --unsafe-perm true
npm install
func azure functionapp publish $TARGET_NAME
```
