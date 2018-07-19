"use strict"
const fetch = require("node-fetch")
const yaml = require("js-yaml")
const fs = require("fs")

exports.command =
  "assign-roles-permissions [host] [port] [phost] [pport] [rhost] [rport] [config] [configstring]"
exports.describe = "assign roles and permissions for a list of users"
exports.builder = yargs => {
  yargs
    .env("USER_API_SERVICE")
    .positional("host", {
      alias: "H",
      type: "string",
      describe: "user api server host",
    })
    .env("USER_API_SERVICE")
    .positional("port", {
      alias: "p",
      type: "string",
      describe: "user api server port",
    })
    .env("PERMISSION_API_SERVICE")
    .positional("phost", {
      alias: "PH",
      type: "string",
      describe: "permission api server host",
    })
    .env("PERMISSION_API_SERVICE")
    .positional("pport", {
      alias: "pp",
      type: "string",
      describe: "permission api server port",
    })
    .env("ROLE_API_SERVICE")
    .positional("rhost", {
      alias: "RH",
      type: "string",
      describe: "role api server host",
    })
    .env("ROLE_API_SERVICE")
    .positional("rport", {
      alias: "rp",
      type: "string",
      describe: "role api server port",
    })
    .positional("config", {
      alias: "c",
      type: "string",
      describe: "config file",
    })
    .positional("configstring", {
      alias: "s",
      type: "string",
      describe: "config file in string format",
    })
    .demandOption(["host", "phost", "rhost"])
    .help("h")
    .example(
      "assign-roles-permissions --host [somehost] --rhost [someotherhost] --phost [anotherhost] -c config.yaml",
    )
}

exports.handler = async argv => {
  const base = `http://${argv.host}:${argv.port}`
  const pbase = `http://${argv.phost}:${argv.pport}`
  const rbase = `http://${argv.rhost}:${argv.rport}`
  try {
    let config
    // check if configstring exists
    // if it does, verify it is a string
    if (
      argv.configstring !== undefined &&
      typeof argv.configstring === "string"
    ) {
      // set config to match the string passed in as argument
      config = yaml.safeLoad(argv.configstring)
    } else if (argv.config !== undefined) {
      // if config arg exists, read the file and set as config
      config = yaml.safeLoad(fs.readFileSync(argv.config))
    } else {
      // if neither config exists then kill the script
      process.exit(1)
    }

    for (const user of config.users) {
      const uendPoint = `${base}/users/email/${user.email}`
      const uresp = await getEntry(uendPoint)
      let rresp, fetchedId

      if (uresp.isError()) {
        if (uresp.notFound()) {
          console.warn(`user ${user.email} not found`)
          continue
        }
        throw new Error(
          `error in fetching user ${user.email}
             ${uresp.message()} ${uresp.description()}`,
        )
      }
      const pfetch = await getEntry(`${pbase}/permissions`)
      for (const perms of pfetch.json) {
        if (perms.attributes.permission === user.role.permission.name) {
          console.log(`
          permission ${user.role.permission.name} already exists
          `)
          fetchedId = perms.id
          rresp = await createEntry(
            `${rbase}/roles`,
            createRoleWithPerm(user.role, fetchedId),
          )
        }
      }
      const presp = await createEntry(
        `${pbase}/permissions`,
        createPermObject(user.role.permission),
      )
      if (presp.isError()) {
        // throw new Error(
        //   `error in creating permission ${user.role.permission.name}
        //     ${presp.message()} ${presp.description()}`,
        // )
        console.log(`
        error in creating permission ${user.role.permission.name}
        ${presp.message()}
        ${presp.description()}
        `)
      }
      rresp = await createEntry(
        `${rbase}/roles`,
        createRoleWithPerm(user.role, presp.getId()),
      )
      if (rresp.isError()) {
        throw new Error(
          `error in creating role with permission
            ${user.role.name} ${rresp.getStatus()}
            ${rresp.message()} ${rresp.description()}`,
        )
      }
      const relresp = await createEntry(
        `${rbase}/roles/${rresp.getId()}/relationships/users`,
        {
          id: rresp.getId(),
          data: [
            {
              id: uresp.getId(),
              type: "users",
            },
          ],
        },
      )
      if (relresp.isError()) {
        throw new Error(
          `error in linking role with user ${user.role.name} ${user.email}
            ${relresp.message()} ${relresp.description()}`,
        )
      }
    }
  } catch (err) {
    console.error(err.message)
  }
}

const getEntry = async url => {
  try {
    const res = await fetch(url)
    const json = await res.json()
    if (res.ok) {
      return new JsonAPI(res, json)
    } else {
      return new ErrorAPI(res, json)
    }
  } catch (err) {
    return new SystemError(err.message)
  }
}

const createEntry = async (url, obj) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(obj),
    })
    if (res.ok) {
      if (res.status == 204) {
        return new EmptyResponse(res)
      }
      const json = await res.json()
      return new JsonAPI(res, json)
    } else {
      const json = await res.json()
      return new ErrorAPI(res, json)
    }
  } catch (err) {
    return new SystemError(err.message)
  }
}

const createRoleWithPerm = (role, permid) => {
  return {
    data: {
      type: "roles",
      attributes: {
        role: role.name,
        description: role.description,
      },
      relationships: {
        permissions: {
          data: [{ type: "permissions", id: permid }],
        },
      },
    },
  }
}

const createPermObject = perm => {
  return {
    data: {
      type: "permissions",
      attributes: {
        permission: perm.name,
        description: perm.description,
        resource: perm.resource,
      },
    },
  }
}

class EmptyResponse {
  constructor(res) {
    this.res = res
  }
  isError() {
    if (this.res.ok) {
      return false
    }
    return true
  }
  isSuccess() {
    return this.res.ok
  }
}

class Response {
  constructor(res, json) {
    this.res = res
    this.json = json
  }
  isError() {
    if (this.res.ok) {
      return false
    }
    return true
  }
  isSuccess() {
    return this.res.ok
  }
  getResponse() {
    return this.res
  }
  getStatus() {
    return this.res.status
  }
}

class SystemError {
  constructor(msg) {
    this.msg = msg
  }
  isError() {
    return true
  }
  isSuccess() {
    return false
  }
  message() {
    return this.msg
  }
  description() {
    return this.msg
  }
  notFound() {
    return false
  }
}

class ErrorAPI extends Response {
  constructor(res, json) {
    super(res, json)
  }
  notFound() {
    if (this.res.status == 404) {
      return true
    }
    return false
  }
  message() {
    return this.json.errors[0].title
  }
  description() {
    return this.json.errors[0].detail
  }
}

class JsonAPI extends Response {
  constructor(res, json) {
    super(res, json)
    this.res = res
    this.json = json.data
  }
  getAttributes() {
    return this.json.attributes
  }
  getType() {
    return this.json.type
  }
  getId() {
    return this.json.id
  }
  getFetchURL() {
    return this.links.self
  }
  getRelationships() {
    return this.json.relationships
  }
}
