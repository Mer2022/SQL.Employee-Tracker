
const inquirer = require("inquirer"); 
let Database = require("./async-db"); 
let cTable = require("console.table"); 
require('dotenv').config()
console.log(process.env.HOST)
console.log(process.env.PORT)
console.log(process.env.USER)
console.log(process.env.PASSWORD)
console.log(process.env.DATABASE)

const db = new Database({ 
    host: process.env.HOST, 
    port: process.env.PORT, 
    user: process.env.USER, 
    password: process.env.PASSWORD, 
    database: process.env.DATABASE
  });
  
async function getManager() {
    let query = "SELECT * FROM employee WHERE manager_id IS NULL";

    const rows = await db.query(query);
    let employeeNames = [];
    rows.map(x=>employeeNames.push(x.first_name+'  '+x.last_name))
    return employeeNames;
}

async function getRoles() {
    let query = "SELECT title FROM role";
    const rows = await db.query(query);

    let roles = [];
    
    rows.map(x=>roles.push(x.title))
    return roles;
}

async function getDptName() {
    let query = "SELECT name FROM department";
    const rows = await db.query(query);

    let departments = [];
    rows.map(x=>departments.push(x.name))

    return departments;
}

async function getDptId(departmentName) {
    let query = "SELECT * FROM department WHERE department.name=?";
    let args = [departmentName];
    const rows = await db.query(query, args);
    return rows[0].id;
}
async function getRoleId(roleName) {
    let query = "SELECT * FROM role WHERE role.title=?";
    let args = [roleName];
    const rows = await db.query(query, args);
    return rows[0].id;
}
async function getEmpId(fullName) {
    let employee = getFnAndLn(fullName);

    let query = 'SELECT id FROM employee WHERE employee.first_name=? AND employee.last_name=?';
    let args=[employee[0], employee[1]];
    const rows = await db.query(query, args);
    return rows[0].id;
}

async function getEmplNames() {
    let query = "SELECT * FROM employee";

    const rows = await db.query(query);
    let employeeNames = [];
    for(const employee of rows) {
        employeeNames.push(employee.first_name + " " + employee.last_name);
    }
    return employeeNames;
}
async function viewEniteRoles() {
    console.log("");
    let query = "SELECT * FROM role";
    const rows = await db.query(query);
    console.table(rows);
    return rows;
}
async function viewEntireDepartments() {
    let query = "SELECT * FROM department";
    const rows = await db.query(query);
    console.table(rows);
}

async function viewAllEmployees() {
    console.log("");

    let query = "SELECT * FROM employee";
    const rows = await db.query(query);
    console.table(rows);
}
async function viewAllEmployeesByDepartment() {
    console.log("");
    let query = "SELECT first_name, last_name, department.name FROM ((employee INNER JOIN role ON role_id = role.id) INNER JOIN department ON department_id = department.id);";
    const rows = await db.query(query);
    console.table(rows);
}
function getFnAndLn( fullName ) {
    let employee = fullName.split(" ");
    if(employee.length == 2) {
        return employee;
    }

    const last_name = employee[employee.length-1];
    let first_name = " ";
    for(let i=0; i<employee.length-1; i++) {
        first_name = first_name + employee[i] + " ";
    }
    return [first_name.trim(), last_name];
}

async function updateEmployeeRole(employeeInfo) {
    const roleId = await getRoleId(employeeInfo.role);
    const employee = getFnAndLn(employeeInfo.employeeName);

    let query = 'UPDATE employee SET role_id=? WHERE employee.first_name=? AND employee.last_name=?';
    let args=[roleId, employee[0], employee[1]];
    const rows = await db.query(query, args);
    console.log(`Updated employee ${employee[0]} ${employee[1]} with role ${employeeInfo.role}`);
}

async function addEmployee(employeeInfo) {
    let roleId = await getRoleId(employeeInfo.role);
    let managerId = await getEmpId(employeeInfo.manager);

    let query = "INSERT into employee (first_name, last_name, role_id, manager_id) VALUES (?,?,?,?)";
    let args = [employeeInfo.first_name, employeeInfo.last_name, roleId, managerId];
    const rows = await db.query(query, args);
    console.log(`Added employee ${employeeInfo.first_name} ${employeeInfo.last_name}.`);
}

async function removeEmployee(employeeInfo) {
    const employeeName = getFnAndLn(employeeInfo.employeeName);
    let query = "DELETE from employee WHERE first_name=? AND last_name=?";
    let args = [employeeName[0], employeeName[1]];
    const rows = await db.query(query, args);
    console.log(`Employee removed: ${employeeName[0]} ${employeeName[1]}`);
}

async function addDepartment(departmentInfo) {
    const departmentName = departmentInfo.departmentName;
    let query = 'INSERT into department (name) VALUES (?)';
    let args = [departmentName];
    const rows = await db.query(query, args);
    console.log(`Added department named ${departmentName}`);
}

async function addRole(roleInfo) {
    const departmentId = await getDptId(roleInfo.departmentName);
    const salary = roleInfo.salary;
    const title = roleInfo.roleName;
    let query = 'INSERT into role (title, salary, department_id) VALUES (?,?,?)';
    let args = [title, salary, departmentId];
    const rows = await db.query(query, args);
    console.log(`Added role ${title}`);
}


async function mainPrompt() {
    return inquirer
        .prompt([
            {
                type: "list",
                message: "What would you like to do?",
                name: "action",
                choices: [
                  "Add department",
                  "Add employee",
                  "Add role",
                  "Remove employee",
                  "Update employee role",
                  "View all departments",
                  "View all employees",
                  "View all employees by department",
                  "View all roles",
                  "Exit"
                ]
            }
        ])
}

async function getAddEmployeeInfo() {
    const managers = await getManager();
    const roles = await getRoles();
    return inquirer
        .prompt([
            {
                type: "input",
                name: "first_name",
                message: "Provide first name of employee."
            },
            {
                type: "input",
                name: "last_name",
                message: "Provide last name of employee."
            },
            {
                type: "list",
                message: "Select employee role.",
                name: "role",
                choices: [
                    ...roles
                ]
            },
            {
                type: "list",
                message: "Select employee's manger name.",
                name: "manager",
                choices: [
                    ...managers
                ]
            }
        ])
}
async function getRemoveEmployeeInfo() {
    const employees = await getEmplNames();
    return inquirer
    .prompt([
        {
            type: "list",
            message: "Select name of employee to be removed.",
            name: "employeeName",
            choices: [
                ...employees
            ]
        }
    ])
}

async function getDepartmentInfo() {
    return inquirer
    .prompt([
        {
            type: "input",
            message: "Provide department name.",
            name: "departmentName"
        }
    ])
}

async function getRoleInfo() {
    const departments = await getDptName();
    return inquirer
    .prompt([
        {
            type: "input",
            message: "Provide title of new role.",
            name: "roleName"
        },
        {
            type: "input",
            message: "Provide salary details of new role.",
            name: "salary"
        },
        {
            type: "list",
            message: "Select the department that uses the new role.",
            name: "departmentName",
            choices: [
                ...departments
            ]
        }
    ])
}

async function getUpdateEmployeeRoleInfo() {
    const employees = await getEmplNames();
    const roles = await getRoles();
    return inquirer
        .prompt([
            {
                type: "list",
                message: "Select employee that needs to be updated.",
                name: "employeeName",
                choices: [
                    ...employees
                ]
            },
            {
                type: "list",
                message: "Provide employee's new role.",
                name: "role",
                choices: [
                    ...roles
                ]
            }
        ])

}

async function main() {
    let exitLoop = false;
    while(!exitLoop) {
        const prompt = await mainPrompt();
        if (prompt.action=='Add department'){
            const newDepartmentName = await getDepartmentInfo();
                await addDepartment(newDepartmentName);
        }
        else if (prompt.action=='Add employee'){
            const newEmployee = await getAddEmployeeInfo();
                console.log("add an employee");
                console.log(newEmployee);
                await addEmployee(newEmployee);
        }
        else if (prompt.action=='Add role'){
                const newRole = await getRoleInfo();
                console.log("add a role");
                await addRole(newRole);
        }
        else if (prompt.action=='Remove employee'){
                const employee = await getRemoveEmployeeInfo();
                await removeEmployee(employee);
        }
        else if (prompt.action=='Update employee role'){
            const employee = await getUpdateEmployeeRoleInfo();
            await updateEmployeeRole(employee);
        }
        else if (prompt.action=='View all departments'){
            await viewEntireDepartments();
        }
        else if (prompt.action=='View all employees'){
            await viewAllEmployees();
            
        }
        else if (prompt.action=='View all employees by department'){
            await viewAllEmployeesByDepartment();
            
        }
        else if (prompt.action=='View all roles'){
            await viewEniteRoles();
            
        }
        else if (prompt.action=='Exit'){
            exitLoop = true;
            process.exit(0);
        }
        else { 
            console.log(`Warning! Incorrect step. Action was ${prompt.action}`);

        }
    }
}

process.on("exit", async function(code) {
    await db.close();
    return console.log(`You will be exiting with code ${code}`);
});

main();

