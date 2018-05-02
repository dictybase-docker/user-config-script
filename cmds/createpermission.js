const fetch = require("node-fetch")

exports.command =
  "createpermission [host] [port] [permission] [description] [resource]"
exports.describe = "create user permission (can be admin, read, write)"
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
    .positional("permission", {
      alias: "P",
      type: "string",
      describe: "name of user permission"
    })
    .positional("description", {
      alias: "d",
      type: "string",
      describe: "description of user permission"
    })
    .positional("resource", {
      alias: "r",
      type: "string",
      describe: "resource on which this permission is granted"
    })
    .demandOption(["host"])
    .help("h")
    .example(
      'createpermission --host localhost --port 31827 --permission admin --description "Total power over all users" --resource dictybase'
    )
    .example(
      'createpermission -H localhost -p 31827 -P admin -d "Total power over all users" -r dictybase'
    )
}

exports.handler = argv => {
  const url = `http://${argv.host}:${argv.port}/permissions`
  // get current timestamp, otherwise it defaults to 1970
  const currentTime = new Date()
  const jsonTime = currentTime.toJSON()
  const body = {
    data: {
      attributes: {
        permission: argv.permission,
        description: argv.description,
        created_at: jsonTime,
        updated_at: jsonTime,
        resource: argv.resource
      }
    }
  }
  postPermission(url, body)
}

const postPermission = async (url, body) => {
  try {
    res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body)
    })
    if (res.ok) {
      json = await res.json()
      console.log("New permission created with this structure:\n\n", json, "\n")
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
