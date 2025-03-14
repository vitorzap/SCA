let dep = {}
dep["Company"] = ["Appointment","Client","Professional","RegularSchedule","Specialty","User"]
dep["Client"] = ["Appointment","City","ClientRegularSchedule","Company","User"]
dep["Professional"] = ["Appointment","Company","ProfessionalSpecialty","RegularSchedule","User"] 
dep["Specialty"] = ["Appointment","Company","ProfessionalSpecialty","RegularSchedule"]
dep["State"] = ["City"]
dep["User"] = ["Client","Company","Professional","UserType"]
dep["City"] = ["Client","State"]
dep["ClientRegularSchedule"] = ["Client","RegularSchedule"]
dep["Appointment"] = ["Client","Professional","Specialty"]
dep["RegularSchedule"] = ["ClientRegularSchedule","Company","Professional","Specialty"]
dep["ProfessionalSpecialty"] = ["Professional","Specialty"]
dep["UserType"] = ["User"]
console.log(dep)
console.log('*********************************************')
let depInvertido = {}
for (let key in dep) {
    dep[key].forEach((element) => {
        if (depInvertido[element] === undefined) {
            depInvertido[element] = []
        }
        depInvertido[element].push(key)
    })
}
console.log(depInvertido)