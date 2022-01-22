const TO_REGISTER = ["v0.boba.local", "v1.boba.local"];

var bonjour = require("bonjour")();

let registeredServices = 0;
TO_REGISTER.forEach((server) => {
  const service = bonjour.publish({
    name: `BobaBoard Server: ${server} `,
    host: server,
    type: "http",
    port: 3000,
  });

  service.on("up", () => {
    registeredServices = registeredServices + 1;
    console.log(`Service ${server} is up!`);
    if (registeredServices == TO_REGISTER.length) {
      console.log("All services are up!");
    }
  });
});

console.log("Registering BobaBoard bonjour services...");
