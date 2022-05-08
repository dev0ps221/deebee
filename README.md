# deebee
mysql requests made easier for nodejs

## example usage

### Installation
```
npm i @tek-tech/deebee
```

### Initialisation
```
const DeeBee = require('@tek-tech/deebee');
```
### simple connection to a mysql database || connexion simple a une base de donnee mysql
```
const DeeBee = require('@tek-tech/deebee');
const credentials = {
    user:'database_username',
    password:'database_password',
    database:'database_name',
    host:'database_host'
};
const connection = new DeeBee(credentials);
connection.whenReady(
    ()=>{
      //do something with the connection
      //faire quelque chose avec la connexion
    }
)
``` 
