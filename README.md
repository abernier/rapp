# INSTALL

```sh
$ docker build --build-arg SSL_KEY="$(cat nginx.key)" --build-arg SSL_CRT="$(cat nginx.crt)" -t rapp .
$ docker run --rm -it -p 5056:80 -p 4056:443 rapp
```

then go to your build static app http://localhost:5056 or https://localhost:4056

NB:
 - If you wonder, `-v "$PWD":/app` is to mount our local current directory to the container. This way when updating a file locally, it is reflected INTO the container also. On the other hand, `-v /app/node_modules` is to exclude the local `node_modules` to be mounted into the container (see: https://stackoverflow.com/a/37898591/133327).
 - Do not forget to add the `nginx.crt` certificate to *Keychain Access* and "Always trust" it:
   ![](https://i.imgur.com/VNFXRmC.png)
 - To generate a new key/crt (see: https://serverfault.com/a/845788/53549):
    ```sh
    openssl req \
      -newkey rsa:2048 \
      -x509 \
      -nodes \
      -keyout nginx.key \
      -new \
      -out nginx.crt \
      -subj /CN=localhost \
      -reqexts SAN \
      -extensions SAN \
      -config <(cat /System/Library/OpenSSL/openssl.cnf \
          <(printf '[SAN]\nsubjectAltName=DNS:localhost,IP:10.0.0.201')) \
      -sha256 \
      -days 3650
    ```

# Dev

```sh
$ docker build --target dev -t rapp .
$ docker run --rm -it -v "$PWD":/app -v /app/node_modules -p 3000:3000 rapp
```

them go to your dev server app http://localhost:3000

---

You want a shell ? Simply add `/bin/sh` to the previous `docker run` command, ie:

```sh
$ docker run --rm -it -v "$PWD":/app -v /app/node_modules -p 3000:3000 rapp /bin/sh
/app # yarn start
```

You are now inside the virtual machine with your local `.` mounted to it.

What about adding/removing a dependency (with the same Docker Node/yarn version)?:
```
/app # yarn add lodash.chunk
/app # yarn remove lodash.chunk
```

## env

We use create-react-app `.env` file according to [documentation](https://create-react-app.dev/docs/adding-custom-environment-variables).

Basically:
 - `.env` contains environmnent variables like `REACT_APP_FOO=bar` available to `src/App.js` (and every js) through `process.env.REACT_APP_FOO`
 - If you need different values for production, simply override them while building:
   ```sh
   $ REACT_APP_FOO=baz yarn build
   ```

Note: You need to restart the development server after changing `.env` file.

## i18n

Fetches (xhr) messages from json file from `public/locales/${locale}.json`, depending on `locale` state :
 - `locale` state is hold into `<I18n>`


### `<I18n>` wrapper (aka. Context Provider)

The i18n context is initialized once in the most outer-component [`src/App.js`](src/App.js).

```jsx
import I18n from './i18n.js';

function App() {
  return (
    <>
      <I18n>
        {/* children */}
      </I18n>
    </>
  );
}
```

### Translating

We use [react-intl](https://www.npmjs.com/package/react-intl):

```jsx
<h1>
  <FormattedMessage id="homepage.h1" defaultMessage="Home sweet home!" />
</h1>
```

`<FormattedMessage>` will look for a `<I18n>.{messages}` with that `homepage.h1` key, and translate with the value.

More infos: https://github.com/formatjs/react-intl/blob/master/docs/Components.md#formattedmessage

### `useI18n()` hook

Then, in any children components, when needed:

```jsx
import I18n from './i18n.js';

function Footer(props) {
  const [i18nState, i18nDispatch, i18nPatch] = useI18n();

  {/* … */}
}
```

`i18nState` exposes:
  - a `(String) locale` property, like `"en"`
  - a `(Object) messages` property, xhr-fetched from `public/locales/*.json` files
  - a `(Boolean) fetching` property, whether fechting is stille active or not

`i18nDispatch(action)` is a dispatch function you can call with:
  - `i18nDispatch({type: "CHANGE_LOCALE", locale: 'it'})` : to change locale to `it`. It will automatically fetch new messages for that new locale
  - `i18nDispatch({type: "ADD_MESSAGES", messages: {"key": "value"}})` : to add messages to the state

`i18nPatch(obj, prefix="")` is a function that receive an object. It will patch that object for every matching key found into `messages`. see: `src/i18n.js:patch` function for more info

# Cron

```sh
$ crontab -e
```

```
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

* * * * *  cd ~/Sites/rapp && ./cron.sh --docker-image=rapp --docker-container=rapp --port=5056 --ssl-key-path=/Users/matchbox/nginx.key --ssl-crt-path=/Users/matchbox/nginx.crt --port-ssl=4056 >>~/var/log/cron/rapp/stdout.log 2>>~/var/log/cron/rapp/stderr.log
```

Then watch the logs:

```sh
tail -f ~/var/log/cron/rapp/std*
```