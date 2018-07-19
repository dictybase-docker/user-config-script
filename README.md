## assign-role-permission

This is a Node.js command line tool that assigns roles and permissions to a list of users.

To get started:

```
npm install https://github.com/dictybase-docker/assign-role-permission
```

You can run `npm link` to set up `user-config` as a script entrypoint.

For help type:

```
user-config -h
```

## assign-roles-permissions

The script accepts four arguments: `assign-roles-permissions [-H|--host <host>] [-p|--port <port>] [-c|--config <config>] [-s|--configstring <configstring>`. It takes the specified config file (YAML format) or config string and adds its roles and permissions to the listed users.

To run the script type:

```
assign-roles-permissions [-H|--host <host>] [-p|--port <port>] [-c|--config <config>]
or
assign-roles-permissions [-H|--host <host>] [-p|--port <port>] [-s|--configstring <configstring>]
```

Example:

```
assign-roles-permissions -H localhost -p 3000 -c config.yaml
```
