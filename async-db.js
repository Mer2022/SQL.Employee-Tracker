const db = require("mysql");

class Database {
  constructor( configuration ) {
      this.connection = db.createConnection( configuration );
  }
  query( sql, args ) {
      return new Promise( ( rectify, deny ) => {
          this.connection.query( sql, args, ( error, rows ) => {
              if ( error ) {
                  return deny( error );
              }
              rectify( rows );
          } );
      } );
  }
  close() {
      return new Promise( ( rectify, deny ) => {
          this.connection.end( error => {
              if ( error )
                  return deny( error );
              rectify();
          } );
      } );
  }
}

module.exports = Database;
