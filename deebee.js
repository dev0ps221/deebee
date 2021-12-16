let resetDbErrs = ['ECONNRESET','PROTOCOL_PACKETS_OUT_OF_ORDER']
const mysql = require('mysql');
const {ADConv} = require('./conversation')
class ADdb{

  db;
  // dbcreds = ['db'=>'epiz_30116080_kinpilibeatz','usr'=>'epiz_30116080','pss'=>'1zQu53UXJBt1s','hst'=>'sql302.epizy.com'];
  dbcreds = {'db':'ad','usr':'root','pss':'root','hst':'localhost'};

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

  _db(){
    return this.db;
  }

  __db(){
    const {usr,pss,hst,db} = this.dbcreds
    try{
      this.db = mysql.createConnection(
        {
          host:hst,
          user:usr,
          password:pss,
          database:db
        }
      )
      this.db.connect(
        err=>{
          try{
            console.log(err?((resetDbErrs.includes(err))? (()=>{this.db.reconnect();return 'error encounteered, made a fix\nretrying connection to database'})():err):'connected to database')
          }catch(e){
            if(resetDbErrs.includes(e.code)) this._db()
            console.log(resetDbErrs.includes(e.code))
          }
        }
      )
      return this.db;
    }catch(e){
      if(resetDbErrs.includes(e.code)) this._db()
      console.log(resetDbErrs.includes(e.code))
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

  //specially kpbeats related db actions

  //MEMBER RELATED STUFF
  //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF
  //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF
  //MEMBER RELATED STUFF        //MEMBER RELATED STUFF
  ___updateMember(fields_,vals_,id=null){
    let table='_members';
    let conds=[
      ['id']
      ,[id]
    ];
    return this._updateReq(table,fields_,vals_,conds);
  }
  ___updateProfile(fields_,vals_,id=null){
    let table='_profile_data';
    let conds=[
      ['id']
      ,[id]
    ];
    return this._updateReq(table,fields_,vals_,conds);
  }
  ___updateActualBg(id,_for,cb,val=true){
      let table='_backgrounds';
      let fields = ['actual']
      let vals = [`${val}`]
      let conds=[
        ['id']
        ,[id]
      ];
      let cleanreq = this._updateReq(table,fields,['false'],[['_for'],[`'${_for}'`]])
      let req = this._updateReq(table,fields,vals,conds)
      this.db.query(cleanreq,(e,r)=>{
        if(e)cb(e,r)
        else{
          this.db.query(
            req,cb
          )
        }
      })


  }
  ___updateNetworks(fields_,vals_,id=null){
    let table='_members_networks';
    let conds=[
      ['id']
      ,[id]
    ];
    return this._updateReq(table,fields_,vals_,conds);
  }

  ___loginreq(table,user,pass){
    return this._req("select",table,["id","name"],[],[['name','password'],["'"+user+"'",`password('${pass}')`]]);
  }

  ___delMember(name,id=null){
    let table='_members';
    let conds=[
      [''+(id?'id':'name')]
      ,[''+(id?id:name)]
    ];
    return this._delReq(table,conds);
  }

  ___newMember({name,email,gender,birthday,star_sign,zodiac,planet,password}){
    let fields = ['name','email','gender','birthday','star_sign','zodiac','planet','password'];
    let vals   = [`'${name}'`,`'${email}'`,`'${gender}'`,`'${birthday}'`,`'${star_sign}'`,`'${zodiac}'`,`'${planet}'`,`password('${password}')`];
    let table  = '_members';
    return this._insertReq(table,fields,vals);
  }

  ___newNotification({member_id,concerned_id,type_}){
    let fields = ['member_id','concerned_id','type'];
    let vals   = [`${member_id}`,`${concerned_id}`,`'${type_}'`];
    let table  = '_notifications';
    return this._insertReq(table,fields,vals);
  }

  ___newFriend({one,two}){
    let fields = ['one','two'];
    let vals   = [`'${one}'`,`'${two}'`];
    let table  = '_friendlist';
    return this._insertReq(table,fields,vals);
  }

  ___newConversation(members){
    let fields = ['members'];
    let vals   = [`'${members.join(',')}'`];
    let table  = '_conversations';
    return this._insertReq(table,fields,vals);
  }

  ___newBackground(data,_for,id=null){
    let fields = ['data','_for','user'];
    let vals   = [`'${data}'`,`'${_for}'`,`${id}`];
    let table  = '_backgrounds';
    return this._insertReq(table,fields,vals);
  }

  ___newMedia(table,data,id=null){
    let fields = ['data','user'];
    let vals   = [`'${data}'`,`${id}`];
    return this._insertReq(table,fields,vals);
  }

  ___newMusic(table,data,name,id=null){
    let fields = ['data','user','name'];
    let vals   = [`'${data}'`,`${id}`,`'${name}'`];
    return this._insertReq(table,fields,vals);
  }

  ___newUrl(url,member_id=null){
    let fields = ['url','member_id'];
    let vals   = [`"${url}"`,member_id];
    let table  = '_url';
    return this._insertReq(table,fields,vals);
  }

  ___newPublicMsg({member_id,message,name,gender}){
    let fields = ['member_id','message','name','gender'];
    let vals   = [member_id,`'${message}'`,`'${name}'`,`'${gender}'`];
    let table  = '_public_chat';
    return this._insertReq(table,fields,vals);
  }

  ___newPrivateMsg({author,message,conversation_id}){
    let fields = ['author','message','conversation_id'];
    let vals   = [author,`'${message}'`,`${conversation_id}`];
    let table  = '_private_chat';
    return this._insertReq(table,fields,vals);
  }

  ___login(user,pass,cb){
    this.db.query(
      this.___loginreq('_members',user,pass)
      ,cb
    )
  }
  ___all_members(cb){
    let req = this._req('select','_members',['id','name','email','gender','birthday','star_sign','zodiac','planet']);
    this.db.query(req,(err,res)=>{
        cb(err?err:res)
      }
    )
  }
  ___all_urls(cb){
    let req = this._req('select','_url',['*']);
    this.db.query(
      req
      ,(err,res)=>{
        let results = []
        if(!err){
          let limit = res.length
          res.forEach(
            (url,idx)=>{
              if(url.member_id){
                this.___member(
                  url.member_id,(re)=>{
                    url.member = re[0]
                    results.push(url)
                    if(limit == idx+1){
                      cb(results)
                    }
                  }
                )
              }else{
                url.member = null
                results.push(url)
                if(limit == idx+1){
                  cb(results)
                }
              }
            }
          )
        }else{
          cb(err)
        }
      }
    )
  }
  ___addPublicMsg(data,cb){
    this.db.query(
      this.___newPublicMsg(
        data
      )
      ,(err,res)=>{
        cb(err)
      }
    )
  }
  ___addPrivateMsg(data,cb){
    this.db.query(
      this.___newPrivateMsg(
        data
      )
      ,(err,res)=>{
        cb(err)
      }
    )
  }
  ___public_chat(cb){
    let req = this._req('select','_public_chat',['*']);
    this.db.query(
      req
      ,(err,res)=>{
        let results = []
        if(!err){
          let limit = res.length
          res.forEach(
            (msg,idx)=>{
              if(msg.member_id){
                this.___member(
                  msg.member_id,(re)=>{
                    msg.member = re[0]
                    results.push(msg)
                    if(limit == idx+1){
                      cb(results)
                    }
                  }
                )
              }else{
                msg.member = null
                results.push(msg)
                if(limit == idx+1){
                  cb(results)
                }
              }
            }
          )
        }else{
          cb(err)
        }
      }
    )
  }
  ___addUrl(url,member_id,cb){
    this.db.query(
      this.___newUrl(
        url,member_id
      )
      ,(err,res)=>{
        cb(err)
      }
    )
  }
  ___addMember(data,cb){
    this.db.query(
      this.___newMember(
        data
      )
      ,cb
    )
  }
  ___addFriend(data,cb){
    this.db.query(
      this.___newFriend(
        data
      )
      ,cb
    )
  }
  ___addNotification(data,cb){
    this.db.query(
      this.___newNotification(
        data
      )
      ,cb
    )
  }
  ___addConversation(members,cb){
    this.db.query(
      this.___newConversation(
        members
      )
      ,cb
    )
  }
  ___addBackground({data,_for,id},cb){
    this.db.query(
      this.___newBackground(
        data,_for,id
      )
      ,cb
    )
  }
  ___addGif({data,id},cb){
    this.db.query(
      this.___newMedia(
        '_gifs',data,id
      )
      ,cb
    )
  }
  ___addMusic({data,id,name},cb){
    this.db.query(
      this.___newMusic(
        '_musics',data,name,id
      )
      ,cb
    )
  }
  ___addPicture({data,id},cb){
    this.db.query(
      this.___newMedia(
        '_pictures',data,id
      )
      ,cb
    )
  }
  ___addVideo({data,id},cb){
    this.db.query(
      this.___newMedia(
        '_videos',data,id
      )
      ,cb
    )
  }

  ___search(name,cb){
    let req = this._req('select','_members',['id','name','email','gender','birthday','star_sign','zodiac','planet'],null,[['name'],[`'${name}' OR name LIKE '%${name}%' OR email LIKE '%${name}%'`]])
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
  ___changeProfilePic(data,cb){
    let req = this._req(
      'update','_profile_data',['profile_picture'],[`'${data.picture}'`],[['member_id'],[data.id]]
    )
    console.log(req)
    this.db.query(
      req,cb
    )

  }
  ___profile(id,cb){
    let req = this._req('select','_profile_data',['*'],null,[['id'],[id]]);
    this.db.query(req,(err,res)=>{
        if(err)cb(err,null)
        else{
          if(!res.length){
            this.db.query(this._req('insert','_profile_data',['member_id'],[id]),(e,r)=>{
              if(e)console.log(e)
              else{
                this.db.query(req,cb)
              }
            })
          }else{
            cb(err,res)
          }
        }
      }
    )
  }
  ___networks(id,cb){
    let req = this._req('select','_members_networks',['*'],null,[['id'],[id]]);
    this.db.query(req,(err,res)=>{
        if(err)cb(err,null)
        else{
          if(!res.length){
            this.db.query(this._req('insert','_members_networks',['member_id'],[id]),(e,r)=>{
              if(e)console.log(e)
              else{
                this.db.query(req,cb)
              }
            })
          }else{
            cb(err,res)
          }
        }
      }
    )
  }
  ___gifs(id,cb){
    let req = this._req('select','_gifs',['*'],null,[['user'],[id]])
    this.db.query(req,cb)
  }
  ___conversations(id,cb){
    let req = this._req('select','_conversations',['*'],null,[['1'],[`1 AND members LIKE '%${id}%'`]])
    this.db.query(req,(e,r)=>{
      if(e){
        console.log(e)
        cb(e,r)
      }else{
        if(r&&r.length){
          let limit = r.length
          let made  = 1
          r.forEach(
            (lm,i)=>{
              r[i].myId = id
              new ADConv(r[i],this,(conv)=>{
                r[i] = conv
                if(made==limit){
                  cb(r)
                }else{
                  made++
                }
              })
            }
          )
          limit = made = null
        }else{
          cb(e,r)
        }
      }
    })
  }
  ___notifications(id,cb){
    let req = this._req('select','_notifications',['*'],null,[['concerned_id','status'],[id,'"unseen"']])
    this.db.query(req,cb)
  }
  ___backgrounds(_for,cb,id=null){
    let _conds = ['_for']
    let _condsVal=[`'${_for}'`]
    if(id) _conds.push(['user']) && _condsVal.push(id)
    let req = this._req('select','_backgrounds',['*'],null,[_conds,_condsVal]);
    this.db.query(req,cb)
  }
  ___musics(id,cb){
    let req = this._req('select','_musics',['*'],null,[['user'],[id]]);
    this.db.query(req,cb)
  }
  ___pictures(id,cb){
    let _conds = []
    let _condsVal=[]
    if(id) _conds.push(['user']) && _condsVal.push(id)
    let req = this._req('select','_pictures',['*'],null,[_conds,_condsVal]);
    this.db.query(req,cb)
  }

  ___videos(id,cb){
    let _conds = []
    let _condsVal=[]
    if(id) _conds.push(['user']) && _condsVal.push(id)
    let req = this._req('select','_videos',['*'],null,[_conds,_condsVal]);
    this.db.query(req,cb)
  }

  ___acceptFriendship(friendship_id,cb){
    let req = this._updateReq(
      '_friendlist',['accepted'],['current_timestamp'],[['friendship_id'],[friendship_id]]
    )
    this.db.query(
      req,cb
    )
  }

  ___cancelFriendship(friendship_id,cb){
    this.___deleteFriendship(friendship_id,cb)
  }

  ___deleteFriendship(friendship_id,cb){
    let req = this._delReq(
      '_friendlist',[['friendship_id'],[friendship_id]]
    )
    this.db.query(req,cb)
  }

  ___friendship(id,cb){
    let friendreqs = []
    let friendreqsreq = this._req('select',`(${this._req('select',"_friendlist inner join _members on _friendlist.one",["*"],null,[['_friendlist.one',"_friendlist.two"],['_members.id',id]])})`,['id','name','email','gender','birthday','star_sign','zodiac','planet','friendship_id','accepted'],[],[[],[]])+"as friendreqs"
    let friendasks = []
    let friendasksreq = this._req('select',`(${this._req('select',"_friendlist inner join _members on _friendlist.two",["*"],null,[['_friendlist.two',"_friendlist.one"],['_members.id',id]])})`,['id','name','email','gender','birthday','star_sign','zodiac','planet','friendship_id','accepted'],[],[[],[]])+"as friendreqs"
    let friends    = []
    let checkFriends = (friendship)=>{
      if(friendship.accepted != '0000-00-00 00:00:00') friends.push(friendship)
    }
    let cleanReqs = (reqs)=>{
      let reQs = []
      reqs.forEach(
        friendship=>{if(friendship.accepted == '0000-00-00 00:00:00') reQs.push(friendship)}
      )
      return reQs
    }
    this.db.query(
      friendreqsreq,(e,r)=>{
        if(e)console.log(e)
        friendreqs = r ? r : friendreqs
        friendreqs.forEach(checkFriends)
        friendreqs = cleanReqs(friendreqs)
        this.db.query(
          friendasksreq,(e1,r1)=>{
            if(e1)console.log(e1)
            friendasks = r1 ? r1 : friendasks
            friendasks.forEach(checkFriends)
            friendasks = cleanReqs(friendasks)
            cb(
              {
                requests:friendreqs,asks:friendasks,friends
              }
            )
          }
        )
      }
    )
  }

  ___member(id,cb){
    let req = this._req('select','_members',['id','name','email','gender','birthday','star_sign','zodiac','planet'],null,[['id'],[id]]);
    this.db.query(req,(err,res)=>{
        if(err)cb(err,null)
        else{
          this.___profile(
            id,(e,r)=>{
              if(e){
                console.log(e)
              }else{
                if(res.length){
                  res[0].profile_data = r[0]
                  this.___networks(
                    id,(er,re)=>{
                      if(er){
                        console.log(er)
                      }else{
                        res[0].networks = re[0]
                        this.___friendship(id,(friendship)=>{
                          res[0].friendship = friendship
                          cb(res)
                        })
                      }
                    }
                  )
                }else{
                  console.log('not registered')
                }
              }
            }
          )
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
        if(fld!='password'){
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

    if(type_=='profile_data'){
      this.db.query(
        this.___updateProfile(fields,vals,id),cb
      )
    }

    if(type_=='networks'){
      this.db.query(
        this.___updateNetworks(fields,vals,id),cb
      )
    }
  }
  //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF
  //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF
  //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF        //MEMBER RELATED STUFF
  //MEMBER RELATED STUFF        //MEMBER RELATED STUFF
  //MEMBER RELATED STUFF
  constructor(){
    this.__db()
  }

}
module.exports = {
  ADdb
}
