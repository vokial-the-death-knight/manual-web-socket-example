const manualWebSocket = require("manual-web-socket");

describe("WebSocket Application", () => {
  it("Connect, send and receive message, receive message, close", () => {
    cy.visit("/", {
      onBeforeLoad(win) {
        /**
         * "Install" ManualWebSocket
         */
        var script = win.document.createElement("script");
        script.innerText = manualWebSocket.getScript();
        win.document.head.appendChild(script);

        /**
         * Track WebSocket connection for "ws://127.0.0.1:3030"
         */
        win.mws.track(["ws://127.0.0.1:3030"]);
      }
    }).then(win => {
      let trackedConnection; // ManualWebSocket connection reference

      /**
       * Connect to WebSocket
       */
      cy.get("#label")
        .should($el => {
          expect($el).to.contain("not connected");
        })
        .get("#connect")
        .click() // Click triggers `index.html` connect() method
        .then(() => {
          trackedConnection = win.mws.trackedConnections.getByUrl(
            "ws://127.0.0.1:3030"
          ); // Get tracked connection
          trackedConnection.readyState = win.mws.readyState.OPEN; // Change readyState from initial `CONNECTING` to `OPEN`
        })
        .get("#label")
        .should($el => {
          expect($el).to.contain("connected");
        });

      /**
       * Send message and receive
       */
      cy.get("#input")
        .type("ping")
        .then(() => {
          /**
           * When you send `ping` through WebSocket, act as server and return sent message + "pong"
           */
          trackedConnection.addServerScenario("ping", (connection, message) => {
            connection.reciveMessage(message + " pong");
          });

          cy.get("#submit")
            .click() // Click triggers `index.html` submit() method
            .get("#messages")
            .should($el => {
              expect($el).to.contain("pong");
            });
        })
        .then(() => {
          /**
           * Act as server and send `another message` to WebSocket connection
           */
          trackedConnection.reciveMessage("another message");
          cy.get("#messages").should($el => {
            expect($el).to.contain("another message");
          });
        })
        .then(() => {
          /**
           * Close connection
           */
          trackedConnection.readyState = win.mws.readyState.CLOSED;
          cy.get("#label").should($el => {
            expect($el).to.contain("closed");
          });
        });
    });
  });
});
