# ![aurelia-computed](aurelia-computed.png)

This library is a plugin for the [Aurelia](http://www.aurelia.io/) platform that provides an `ObjectObservationAdapter` that plugs into Aurelia's binding system.  For more info on Aurelia's pluggable binding system see [this post](http://www.danyow.net/aurelia-property-observation/).

**How does it work?**

This adapter works with properties with getter functions.  It uses Aurelia's javascript parser to parse the body of the function, which results in an [abstract syntax tree (AST)](http://en.wikipedia.org/wiki/Abstract_syntax_tree).  The AST is then checked for "observability" and an observer is returned.

**What types of computed properties can this adapter observe?**

todo: list scenarios

## Get Started

1. Install aurelia-computed:

  ```bash
  jspm install github:jdanyow/aurelia-computed
  ```
2. Use the plugin in your app's main.js:

  ```javascript
  export function configure(aurelia) {
    aurelia.use
      .standardConfiguration()
      .plugin('aurelia-computed');  // <--------<<

    aurelia.start().then(a => a.setRoot());
  }
  ```

## Dependencies

* [aurelia-binding](https://github.com/aurelia/binding)
* [aurelia-logging](https://github.com/aurelia-logging)

## Platform Support

This library can be used in the **browser** only.

## Building The Code

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. Ensure that [Gulp](http://gulpjs.com/) is installed. If you need to install it, use the following command:

  ```shell
  npm install -g gulp
  ```
4. To build the code, you can now run:

  ```shell
  gulp build
  ```
5. You will find the compiled code in the `dist` folder, available in three module formats: AMD, CommonJS and ES6.

6. See `gulpfile.js` for other tasks related to generating the docs and linting.

## Running The Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. Ensure that the [Karma](http://karma-runner.github.io/) CLI is installed. If you need to install it, use the following command:

  ```shell
  npm install -g karma-cli
  ```
2. Ensure that [jspm](http://jspm.io/) is installed. If you need to install it, use the following commnand:

  ```shell
  npm install -g jspm
  ```
3. Install the client-side dependencies with jspm:

  ```shell
  jspm install
  ```

4. You can now run the tests with this command:

  ```shell
  karma start
  ```