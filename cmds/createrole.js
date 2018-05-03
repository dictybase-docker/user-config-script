const fetch = require("node-fetch")

exports.command = "createrole [host] [role] [description]"
exports.describe = "create user role"
exports.builder = yargs => {
  yargs
    .env("USER_API_SERVICE_HOST")
    .positional("host", {
      alias: "H",
      type: "string",
      default: "betaapi",
      describe: "api server"
    })
    .positional("role", {
      alias: "r",
      type: "string",
      describe: "name of user role"
    })
    .positional("description", {
      alias: "d",
      type: "string",
      describe: "description of user role"
    })
    .demandOption(["host"])
    .help("h")
    .example(
      'createrole --host localhost --role superuser --description "Total power!"'
    )
    .example('createrole -H localhost -r superuser -d "Total power!"')
}

exports.handler = argv => {
  const url = `http://${argv.host}/roles`
  // get current timestamp, otherwise it defaults to 1970
  const currentTime = new Date()
  const jsonTime = currentTime.toJSON()
  const body = {
    data: {
      attributes: {
        role: argv.role,
        description: argv.description,
        created_at: jsonTime,
        updated_at: jsonTime
      }
    }
  }
  postRole(url, body)
}

const postRole = async (url, body) => {
  try {
    res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body)
    })
    if (res.ok) {
      json = await res.json()
      console.log("New role created with this structure:\n\n", json, "\n")
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
