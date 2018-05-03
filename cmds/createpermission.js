const fetch = require("node-fetch")

exports.command =
  "createpermission [host] [permission] [description] [resource]"
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
    .positional("permission", {
      alias: "p",
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
      'createpermission --host localhost --permission admin --description "Total power over all users" --resource dictybase'
    )
    .example(
      'createpermission -H localhost -p admin -d "Total power over all users" -r dictybase'
    )
}

exports.handler = argv => {
  const url = `http://${argv.host}/permissions`
  const body = {
    data: {
      attributes: {
        permission: argv.permission,
        description: argv.description,
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
