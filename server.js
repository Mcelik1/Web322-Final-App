

var express = require("express");
var app = express();
var path = require("path");
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const dataServiceComments=require("./data-service-comments.js");
var data_service = require("./data-service.js");
var clientSessions = require("client-sessions");
var dataServiceAuth = require("./data-service-auth");


var HTTP_PORT = process.env.PORT || 8080;



app.use(express.static('public'));


//function to ensure user logs in
function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }


//sessions
app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "A7_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
  }));








app.use(bodyParser.urlencoded({ extended: true }));
app.engine(".hbs", exphbs({
  extname: ".hbs",
  defaultLayout: 'layout',
  helpers: {
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}));
app.set("view engine", ".hbs");



app.listen(HTTP_PORT, function onHttpStart() {
    
    console.log("== Express http server listening on: " + HTTP_PORT + " ==");
 
    return new Promise((res, req) => {
        data_service.initialize().then(()=> {
            
            console.log("Loaded dataservice.js");
            
        }).catch((err) => {
            console.log(err);
        });

          //initialize dataServiceComments
        dataServiceComments.initialize().then(() => {
               
                console.log("Loaded data-service-comment.js ");
         
                console.log("\n");
           }).catch((err) => {
               console.log(err);
            });

            //initialize dataservice auth!
            dataServiceAuth.initialize().then(() => {
                console.log("\n");
                console.log("Loaded data-service-auth.js");
                console.log("\n");
               }).catch((err) => {
                   console.log(err);
                });


        }).catch(()=> {
            console.log("dataService Error:Unable to start data service");
    });
});




app.get("/", (req, res) => {
    
    res.render("home", {user: req.session.user});
});


app.get("/about", (req, res) => {
    dataServiceComments.getAllComments().then((dataFromPromise) => {
       res.render("about", {data: dataFromPromise,user: req.session.user});
    }).catch(() => {
        res.render("about");
    });
});

app.get("/employees", ensureLogin,(req, res) => {
    if (req.query.status) {
        data_service.getEmployeesByStatus(req.query.status).then((data) => {
            res.render("employeeList", { data: data, title: "Employees", user: req.session.user});
        }).catch((err) => {
            res.render("employeeList", { data: {}, title: "Employees" });
        });
    } else if (req.query.department) {
        data_service.getEmployeesByDepartment(req.query.department).then((data) => {
            res.render("employeeList", { data: data, title: "Employees", user: req.session.user});
        }).catch((err) => {
            res.render("employeeList", { data: {}, title: "Employees" });
        });
    } else if (req.query.manager) {
        data_service.getEmployeesByManager(req.query.manager).then((data) => {
            res.render("employeeList", { data: data, title: "Employees", user: req.session.user});
        }).catch((err) => {
            res.render("employeeList", { data: {}, title: "Employees" });
        });
    } else {
        data_service.getAllEmployees().then((data) => {
            res.render("employeeList", { data: data, title: "Employees", user: req.session.user});
        }).catch((err) => {
            res.render("employeeList", { data: {}, title: "Employees"});
        });
    }
});

app.get("/employee/:empNum", ensureLogin, (req, res) => {
    
        let viewData = {};
        data_service.getEmployeeByNum(req.params.empNum).then((data) => {
            viewData.data = data; 
        }).catch(() => {
            viewData.data = null;
        }).then(data_service.getDepartments).then((data) => {
            viewData.departments = data; 
          
            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.data[0].department) {
                    viewData.departments[i].selected = true;
                }
            }
           
            if (viewData.departments[viewData.departments.length - 1].departmentId != viewData.data[0].department) {
                viewData.departments.Selected = false;
            }
        }).catch(() => {
            viewData.departments = []; 
        }).then(() => {
            if (viewData.data == null) { 
                res.status(404).send("Employee Not Found!");
            } else {
                res.render("employee", { viewData: viewData, user: req.session.user }); 
            }
        });
    });

app.get("/managers", ensureLogin, (req, res) =>{
  data_service.getManagers().then((data) => {
    res.render("employeeList", { data: data, title: "Employees (Managers)",user: req.session.user }); 
  }).catch((err) =>{
    res.render("employeeList", { data: {}, title: "Employees (Managers)" });
  });
});

app.get("/departments", ensureLogin,(req, res) =>{
  data_service.getDepartments().then((data) =>{
    res.render("departmentList", { data: data, title: "Departments", user: req.session.user });
  }).catch((err) => {
    res.render("departmentList", { data: {}, title: "Departments" });
  });
});

app.get("/employees/add", ensureLogin,(req, res) => {
    data_service.getDepartments().then((data) => {
        res.render("addEmployee", { departments: data,user: req.session.user });
    }).catch((err) => {
        res.render("addEmployee", { departments: [] });
    });
});

app.post("/employees/add", ensureLogin,(req, res) => {
    data_service.addEmployee(req.body).then((data) => {
        console.log(req.body);
        res.redirect("/employees");
    }).catch((err) => {
        console.log(err);
    })
});

app.post("/employees/update",ensureLogin, (req, res) => {
    console.log(req.body);
    res.redirect("/employees");
});

app.post("/employee/update",ensureLogin, (req, res) => {
    data_service.updateEmployee(req.body).then((data) => {
        console.log(req.body);
        res.redirect("/employees");
    }).catch((err) => {
        console.log(err);
    })
});

//new routes from assignment5

app.get("/departments/add", ensureLogin, (req, res) => {
    res.render("addDepartment", { title: "Department",user: req.session.user });
});

app.post("/departments/add", ensureLogin, (req, res) => {
    data_service.addDepartment(req.body).then((data) => {
        res.redirect("/departments");
    }).catch(() => {
        console.log(err);
    });
});

app.post("/department/update", ensureLogin, (req, res) => {
    data_service.updateDepartment(req.body).then((data) => {
        res.redirect("/departments");
    });
});

app.get("/department/:departmentId", ensureLogin, (req, res) => {
    data_service.getDepartmentById(req.params.departmentId).then((data) => {
        res.render("department", {
            data: data,
            user: req.session.user
        });
    }).catch((err) => {
        res.status(404).send("Department Not Found");
    });
});

app.get("/employee/delete/:empNum", ensureLogin,(req, res) => {
    data_service.deleteEmployeeByNum(req.params.empNum).then((data) => {
        res.redirect("/employees");
    }).catch((err) => {
        res.status(500).send("Unable to Remove Employee! Employee does not exist!");
    });
});

app.post("/about/addComment", (req, res) => {
    dataServiceComments.addComment(req.body).then((data) => {
        res.redirect("/about");
    }).catch(() => {
        res.reject("Error!");
        res.redirect("/about");
    });
});

app.post("/about/addReply", (req, res) => {
    dataServiceComments.addReply(req.body).then((data) => {
        res.redirect("/about");
    }).catch((err) => {
        reject("Error!");
        redirect("/about");
    });
});


//routes from assignement 7

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body).then(() => {
        res.render("register", {successMessage: "User successfully created!"});
    }).catch((err) => {
        res.render("register", {errorMessage: err, user: req.body.user});
    });
});

app.post("/login", (req, res) => {
    dataServiceAuth.checkUser(req.body).then(() => {
        const username = req.body.user;
        req.session.user = {
            username: username
        };
        res.redirect("/employees");
    }).catch((err) => {
       
        res.render("login", {errorMessage: err, user: req.body.user});
    });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect('/');
});



app.use(function (req, res) {
  res.status(404).send("Error:Page not Found!");
});

//app.listen(HTTP_PORT, onHttpStart);

