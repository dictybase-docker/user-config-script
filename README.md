## User config script

This is a Node.js command line tool that assigns roles and permissions to a list of users.

To get started:

```
npm install https://github.com/dictybase-playground/user-config-script
```

For help type:

```
node index -h
```

## assign-roles-permissions

The script accepts three arguments: `assign-roles-permissions [-H|--host <host>] [-p|--port <port>] [-c|--config <config>]`. It takes the specified config file (YAML format) and adds its roles and permissions to the listed users.

To run the script type:

```
assign-roles-permissions [-H|--host <host>] [-p|--port <port>] [-c|--config <config>]
```

Example:

```
assign-roles-permissions -H localhost -p 3000 -c config.yaml
```

The command `user-config` has been added as an entry point, and you can gain access to this by using `npm link`. After doing so, you can issue commands via `user-config assign-roles-permissions ...` rather than `node index assign-roles-permissions ...`.
