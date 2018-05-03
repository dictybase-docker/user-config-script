const fetch = require("node-fetch")

// note: this is currently not working (Unexpected end of JSON input)
// possibly related to concurrent async functions

exports.command = "fetch [host]"
exports.describe =
  "retrieve list of users, then assign each a default role with permissions"
exports.builder = yargs => {
  yargs
    .env("USER_API_SERVICE_HOST")
    .positional("host", {
      alias: "H",
      type: "string",
      default: "betaapi.dictybase.local",
      describe: "api server"
    })
    .demandOption(["host"])
    .help("h")
    .example("fetch --host betaapi.dictybase.local")
    .example("fetch -H betaapi.dictybase.local")
}

exports.handler = argv => {
  const url = `http://${argv.host}/users`
  getUsers(argv, url)
}

// first get list of users with GET /user endpoint
const getUsers = async (argv, url) => {
  try {
    res = await fetch(url)
    if (res.ok) {
      json = await res.json()
      getUserInfo(argv, json)
    } else {
      json = await res.json()
      printError(res, json)
    }
  } catch (err) {
    console.log(`network error: ${err.message}`)
  }
}

// get email and user id, then call next function
const getUserInfo = (argv, json) => {
  const userData = json.data
  for (let user of userData) {
    const email = user.attributes.email
    const userId = user.id
    console.log("email:", email, ", id:", userId)
    findRole(argv, "user", `http://${argv.host}/roles`, userId)
  }
  // json.data.forEach(user => {
  //   const email = user.attributes.email
  //   const userId = user.id
  //   console.log("email:", email, ", id:", userId)
  //   findRole(argv, "user", `http://${argv.host}/roles`, userId)
  // })
}

// find the role of user
const findRole = async (argv, role, url, userId) => {
  try {
    res = await fetch(url)
    if (res.ok) {
      json = await res.json()
      const roleData = json.data
      for (let item of roleData) {
        const role = item.attributes.role
        const roleId = item.id
        if (role === "user") {
          const body = {
            data: [
              {
                id: userId
              }
            ]
          }
          const url = `http://${argv.host}/roles/${roleId}/relationships/users`
          postRole(url, body)
        }
      }
      // json.data.forEach(item => {
      //   const role = item.attributes.role
      //   const roleId = item.id
      //   if (role === "user") {
      //     const body = {
      //       data: [
      //         {
      //           id: userId
      //         }
      //       ]
      //     }
      //     const url = `http://${argv.host}/roles/${roleId}/relationships/users`
      //     postRole(url, body)
      //   }
      // })
    } else {
      json = await res.json()
      printError(res, json)
    }
  } catch (err) {
    console.log(`network error: ${err.message}`)
  }
}

// associate role to each user
const postRole = async (url, body) => {
  try {
    res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body)
    })
    console.log(res.json())
    if (res.ok) {
      json = await res.json()
      console.log(json)
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
