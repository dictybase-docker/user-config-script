const fetch = require("node-fetch")

// note: this is currently not working (Unexpected end of JSON input)

exports.command =
  "createpermissionrelationship [host] [port] [roleid] [permissionid]"
exports.describe = "create permission relationship with role"
exports.builder = yargs => {
  yargs
    .env("USER_API_SERVICE_HOST")
    .positional("host", {
      alias: "H",
      type: "string",
      default: "betaapi",
      describe: "api server"
    })
    .env("USER_API_SERVICE_PORT")
    .positional("port", {
      alias: "p",
      type: "number",
      describe: "api server port"
    })
    .positional("roleid", {
      alias: "r",
      type: "string",
      describe: "ID of user role"
    })
    .positional("permissionid", {
      alias: "P",
      type: "string",
      describe: "ID of user permission"
    })
    .demandOption(["host"])
    .help("h")
    .example(
      "createpermissionrelationship --host localhost --port 31827 --roleid 1 --permissionid 1"
    )
    .example("createpermissionrelationship -H localhost -p 31827 -r 1 -P 1")
}

exports.handler = argv => {
  const url = `http://${argv.host}:${argv.port}/roles/${
    argv.roleid
  }/permissions/permissions`
  const body = {
    data: [
      {
        id: argv.permissionid
      }
    ]
  }
  createRelationship(url, body)
}

const createRelationship = async (url, body) => {
  try {
    res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body)
    })
    console.log(res.json())
    if (res.ok) {
      json = await res.json()
      console.log(
        "New permission relationship created with this structure:\n\n",
        json,
        "\n"
      )
    } else {
      json = await res.json()
      printError(res, json)
    }
  } catch (err) {
    console.log(err.message)
  }
}

const printError = (res, json) => {
  console.log("got http error******")
  console.log(
    `http response: ${res.status}
         title: ${json.errors[0].title}
         detail: ${json.errors[0].detail}
        `
  )
}
