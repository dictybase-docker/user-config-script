const fetch = require("node-fetch")
const yaml = require("js-yaml")
const fs = require("fs")

exports.command = "assign-roles-permissions [host] [port] [config]"
exports.describe = "assign roles and permissions for a list of users"
exports.builder = yargs => {
  yargs
    .env("USER_API_SERVICE_HOST")
    .positional("host", {
      alias: "H",
      type: "string",
      describe: "api server host",
    })
    .env("USER_API_SERVICE_PORT")
    .positional("port", {
      alias: "p",
      type: "string",
      describe: "api server port",
      default: "80",
    })
    .positional("config", {
      alias: "c",
      type: "string",
      describe: "config file",
    })
    .demandOption(["host", "config"])
    .help("h")
    .example(
      "assign-roles-permissions --host betaapi.dictybase.local -c config.yaml",
    )
}

exports.handler = argv =>
  (async () => {
    base = `http://${argv.host}:${argv.port}`
    try {
      config = yaml.safeLoad(fs.readFileSync(argv.config))
      for (const user of config.users) {
        const uendPoint = `${base}/users/email/${user.email}`
        const uresp = await getUser(uendPoint)
        if (uresp.isError()) {
          if (uresp.notFound()) {
            console.warn(`user ${user.email} not found`)
            continue
          }
          throw new Error(
            `error in fetching user ${user.email}
             ${resp.message} ${resp.description}`,
          )
        }
        const presp = await createEntry(
          `${base}/permissions`,
          createPermObject(user.role.permission),
        )
        if (presp.isError()) {
          throw new Error(
            `error in creating permission ${user.role.permission.name}
            ${presp.message} ${presp.description}`,
          )
        }
        const rresp = await createEntry(
          `${base}/roles`,
          createRoleWithPerm(user.role, presp.getId()),
        )
        if (rresp.isError()) {
          throw new Error(
            `error in creating role with permission ${user.role.name}
            ${rresp.message} ${rresp.description}`,
          )
        }
        const relresp = await createEntry(
          rresp.getRelationships().users.links.self,
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
            ${relresp.message} ${relresp.description}`,
          )
        }
      }
    } catch (err) {
      console.error(err.message)
    }
  })()

const getUser = async url => {
  try {
    const res = await fetch(url)
    const json = await res.json()
    if (res.ok) {
      return new JsonAPI(res, json)
    } else {
      return new ErrorAPI(res, json)
    }
  } catch (err) {
    return new Error(err.message)
  }
}

const createEntry = async (url, obj) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(obj),
    })
    if (res.ok) {
      return new JsonAPI(res, json)
    } else {
      return new ErrorAPI(res, json)
    }
  } catch (err) {
    return new Error(err.message)
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

class Response {
  constructor(res, json) {
    this.res = res
    this.json = json
  }
  isError() {
    !this.res.ok
  }
  isSuccess() {
    this.res.ok
  }
  getResponse() {
    this.res
  }
  getStatus() {
    this.res.status
  }
}

class ErrorAPI extends Response {
  notFound() {
    if (this.res.status == 404) {
      return true
    }
    return false
  }
  message() {
    this.json.errors[0].title
  }
  description() {
    this.json.errors[0].detail
  }
}

class JsonAPI extends Response {
  constructor(res, json) {
    this.res = res
    this.json = json.data
  }
  getAttributes() {
    this.json.attributes
  }
  getType() {
    this.json.type
  }
  getId() {
    this.json.id
  }
  getFetchURL() {
    this.links.self
  }
  getRelationships() {
    this.relationships
  }
}
