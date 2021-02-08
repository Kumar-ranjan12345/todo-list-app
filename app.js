//jshint es-version:6

//required modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
//now we will store data in our database

//connecting to our db
mongoose.connect("mongodb://localhost:27017/todolistDB",  {useNewUrlParser: true, useUnifiedTopology: true });

//db schema
const itemsSchema = {
  name: String
};
//model created using the above schema
const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } 
        else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    }
    //we want to render those items we inserted 
      //below code line will redirect our server to home again and that time it already have inserted items using above code into data , so it will fall directly into the else part below for rendering our items
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName); //using lodash to remove capital letter discrepancies from newly created list names

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){ // it means , if there was no list found with typed name , then create one
        //Create a new list
        const list = new List({
          name: customListName, // it will get the customListName as name of the list
          items: defaultItems // default ones for every route
        });
        list.save();
        //by this time our new list will be created in our database but it will not redirect/show the newly created page in browser , so the below code
        res.redirect("/" + customListName);
      } 
      else {
        //Show an existing list
        //below code will show the newly created list with title which user type with default 
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){

  //we are saving the new item user will insert using the + sign
  const itemName = req.body.newItem; //from input tag in list.ejs
  const listName = req.body.list; //from the button tag in list.ejs file because we want to submit and show the entered value in that page itself not in home page
  //we have to create a new item document using mongoose to sae to our db
  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    // item.save();
    // res.redirect("/");
    //just save the item
    item.save() ;
    //so at this point our new entry is saved to our database but it is not showing in the list , so
    res.redirect("/")//it will redirect to home directory , which will run the else part to render that our list
  } 
  else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//handling the delete action , means whenever we a check a box , at that ime we want the item to be removed from out list , so
app.post("/delete", function(req, res){
   //also we want to submit the form when checked(delete)
  const checkedItemId = req.body.checkbox;  // here we are getting the id of the checked item from our todolist when a user will check the id
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        //console.log("Successfully deleted checked item.");
        //res.redirect("/");
        console.log("Successfully deleted!"); // it will delete the item from database but it will not reflect in our todo list page , to do so we have to redirect it again to home page
        res.redirect("/") ; // it will redirect to home page which will gain find the remained items and will show in the to do list web page
      }
    });
  } 
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });


app.get("/about", function(req, res){
  res.render("about");
});

//listening at port 3000
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
