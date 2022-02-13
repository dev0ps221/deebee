let resetDbErrs = ['ECONNRESET','PROTOCOL_PACKETS_OUT_OF_ORDER']
const mysql = require('mysql');
const {Ear} = require('@tek-tech/ears')

class DeeBee extends Ear{


  _____registerAction(actionname,callback){
    this[actionname] = callback
  }

  _tbs(){
    let tbs = [];
    let act = this.__db().query(
      "SHOW TABLES"
    );
    while(d = act.fetch()){
      array_push(tbs,d[0]);
    }
    return tbs;
  }

  _setUsersTable(tbl = null){
    this.usersTable = tbl
  }
  _setUsersPasswField(field='password'){
    this.usersPasswField = field
  }
  _getUsersPasswField(){
    return this.usersPasswField
  }
  _getUsersTable(tbl){
    return this.usersTable
  }
  _setUsersLogField(field='name'){
    this.usersLogField = field
  }
  _getUsersLogField(){
    return this.usersLogField
  }

  _db(){
    return this.db;
  }

  __db(){
    try{
      this.db = mysql.createConnection(this.dbcreds)
      this.db.on(
        'error',err=>{
          try{
            console.log(err?((resetDbErrs.includes(err))? (()=>{this.db.reconnect();return 'error encounteered, made a fix\nretrying connection to database'})():err):(()=>{
              this.ready = 1
              return 'connected to database'
            })())
          }catch(e){
            if(resetDbErrs.includes(e.code)) this._db()
          }
        }
      )
      this.db.connect(
        err=>{
          try{
            console.log(err?((resetDbErrs.includes(err))? (()=>{this.db.reconnect();return 'error encounteered, made a fix\nretrying connection to database'})():err):(()=>{
              this.ready = 1
              return 'connected to database'
            })())
          }catch(e){
            if(resetDbErrs.includes(e.code)) this._db()
          }
        }
      )
      return this.db;
    }catch(e){
      if(resetDbErrs.includes(e.code)) this._db()
    }
  }

  __reqArr(fields_,vals_,statement){
      for(let i = 0; i < (fields_.length) ; i++){
        statement.bindParam(":"+fields_[i],vals_[i]);
      }
      return statement;
  }

  __valsStr(vals_,bef='',aft=''){
    let vals="";
    for(let i = 0 ; i < (vals_.length) ;i++ ){
      vals+=(bef)+vals_[i]+(i+1 < (vals_.length) ? "," : "")+(aft);
    }

    return vals;
  }

  __fvalStr(fields_=[],vals_=[],sep=',',bef='',aft='',vbef=""){
    let vals = "";
    for(let i = 0 ; i < (vals_.length) ;i++ ){
      vals+=(bef)+fields_[i]+"="+vbef+vals_[i]+(i+1 < (vals_.length) ? " "+sep+" " : "")+(aft);
    }

    return vals;
  }

  __condsStr(fields_=[],vals_=[],bef=""){
    return (fields_.length) ? " WHERE "+this.__fvalStr(fields_,bef?fields_:vals_,"AND","","",bef) : "";
  }

  __selectFrom(table_,fields_=[],conds=[[],[]]){
    return "SELECT "+this.__valsStr(fields_)+" FROM "+ table_ +((conds.length) ? this.__condsStr(conds[0],conds[1]) : "");
  }

  __delFrom(table_,conds=[[],[]]){
    return "DELETE  FROM "+ table_ + this.__condsStr(conds[0],conds[1],":");
  }

  __updtWhere(table_,fields_,vals_,conds=[[],[]]){
    return "UPDATE "+ table_ +" SET "+ this.__fvalStr(fields_,vals_,",") +this.__condsStr(conds[0],conds[1]);
  }

  __insertINTO(table,fields_=[],vals_=[]){
    return "INSERT INTO "+table+" ("+this.__valsStr(fields_)+") VALUES ("+this.__valsStr(vals_)+")";
  }

  _req(type_,table_,fields_=[],vals_=[],conds=[[],[]]){
    let req = "";
    switch (type_) {
      case 'select':
        req = this.__selectFrom(table_,fields_,conds);
        break;
      case 'insert':
        req = this.__insertINTO(table_,fields_,vals_);
        break;
      case 'delete':
        req = this.__delFrom(table_,conds);
        break;
      case 'update':
        req = this.__updtWhere(table_,fields_,vals_,conds);
        break;
      default:
        // code...
        break;
    }

    return req;
  }

  _insertReq(table_,fields_,vals_,c){
    return this._req(
          'insert'
          ,table_
          ,fields_
          ,vals_
        )
  }

  _updateReq(table_,fields_,vals_,conds_){
    return this._req(
          'update'
          ,table_
          ,fields_
          ,vals_
          ,conds_
        )
  }

  _delReq(table_,conds_,cb){
    return this._req(
      'delete',
      table_,
      conds_
    )
  }

  ___updateMember(fields_,vals_,id=null){
    let table=this._getUsersTable();
    let conds=[
      ['id']
      ,[id]
    ];
    return this._updateReq(table,fields_,vals_,conds);
  }
  ___loginreq(table,user,pass){
    return this._req("select",table,["id",this._getUsersLogField()],[],[[this._getUsersLogField(),this._getUsersPasswField()],["'"+user+"'",`password('${pass}')`]]);
  }

  ___delMember(name,id=null){
    let table=this._getUsersTable();
    let conds=[
      [''+(id?'id':this._getUsersLogField())]
      ,[''+(id?id:name)]
    ];
    return this._delReq(table,conds);
  }


  ___newNotification({member_id,concerned_id,type_}){
    let fields = ['member_id','concerned_id','type'];
    let vals   = [`${member_id}`,`${concerned_id}`,`'${type_}'`];
    let table  = '_notifications';
    return this._insertReq(table,fields,vals);
  }

  ___login(user,pass,cb){
    this.db.query(
      this.___loginreq(this._getUsersTable(),user,pass)
      ,cb
    )
  }

  ___all_members(cb){
    let req = this._req('select',this._getUsersTable(),['*']);
    this.db.query(req,(err,res)=>{
        if(res&&res.length){
          let r = []
          res.forEach(
            match=>{
                match.passw = null
                r.push(match)
            }
          )
          res = r
        }
        cb(err?err:res)
      }
    )
  }

  ___search(name,cb){
    let req = this._req('select',this._getUsersTable(),['id','name','email','gender','birthday','star_sign','zodiac','planet'],null,[['name'],[`'${name}' OR name LIKE '%${name}%' OR email LIKE '%${name}%'`]])
    this.db.query(req,(err,res)=>{
        if(res && res.length){
          res = res.map(match=>{
            if(match.name.match(name)) match.matchedBy = 'name'
            if(match.email.match(name)) match.matchedBy = 'email'
            return match
          })
        }
        cb(err,res)
      }
    )
  }

  ___member(id,cb){
    let req = this._req('select',this._getUsersTable(),['id','name','email','gender','birthday','star_sign','zodiac','planet'],null,[['id'],[id]]);
    this.db.query(req,(err,res)=>{
        if(err)cb(err,null)
        else{
          cb(res)
        }
      }
    )
  }

  ___update(type_,data,id,cb){

    let fields = data[0]
    let vals   = data[1]
    let  flds = []
    let  vls  = []
    fields.forEach(
      (fld,i)=>{
        if(fld!=this._getUsersPasswField()){
          flds.push(fields[i])
          vls.push(vals[i])
        }else{
          if(vals[i]){
            flds.push(fields[i])
            vls.push(`password(${vals[i]})`)
          }
        }
      }
    )
    fields = flds
    vals   = vls

    if(type_=='member'){
      this.db.query(
        this.___updateMember(fields,vals,id),cb
      )
    }

  }
  constructor(creds){
    super()
    this.db = null;
    this.dbcreds = creds
    this._setUsersTable('_members')
    this.__db()
  }

}
module.exports = DeeBee
