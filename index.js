var express = require('express');
var contentful = require('contentful');
var showdown = require('showdown');

var converter = new showdown.Converter();

//declare static paths & views
//to be used for high value landers
//prevents a total site outage should
//contentful fail / go down
var staticPaths = {
    'path1': 'view1',
    'path2': 'view2',
    'path3': 'view3'
}

//create express app
//set views to ejs
//set homepage view
var app = express();
app.set('view engine', 'ejs');

//homepage view
app.get('/', function (req, res) {
    res.render('homepage');
 })

 //404 view
app.get('/404', function (req, res) {
    res.status('404');
    res.render('404');
})

//get all non homepage url requests
app.get('/*', function (req, res) {

    //grab path from req
    var path = req.params[0];

    //remove trailing '/' if present
    var pathLastChar = path.slice(-1);
    if(pathLastChar === "/"){
        path = path.substring(0, path.length -1);
    }

    //check if path is one of our statics
    if(staticPaths.hasOwnProperty(path)){

        //if it is render its view
        res.render(staticPaths[path]);
        
    }else{

        //initiate contentful api client
        var contentfulSpace = "k9k8clavjslr";
        var contentfulAPIKey = "27a82daa3ba11f847e69ff0052d1a3d1b19bb9a460cb11bd7d36769194d9d7b6";
        var client = contentful.createClient({
            space: contentfulSpace,
            accessToken: contentfulAPIKey
        });

        //request any content post where it's url_path field
        //matches the url path that has been requestes
        client.getEntries({
            'fields.url_path': path,
            'content_type': 'test'
        })

        .then(function (entries) {

            //if there are 0 responses no content exists
            //so return 404
            //if there are more than 1 responses
            //we have dupicate content in the cms (shouldnt be possible)
            //return 404
            if(entries.items.length !== 1){
                res.redirect('404');
            }else{
                //if we have exactly 1 post
                //pull all the fields for this post
                //pull out the theme (view) from the fields
                //render the theme (view) and pass in the post fields
                //our ejs views will take the fields and populate the corrosponding
                //dynamic attributes before rendering
                entries.items.forEach(function(entry) {
                    var fields = entry.fields;
                    
                    res.render(fields.theme, fields, function(err, html){
                        if(err){
                            res.redirect('404');
                        }else{
                            res.send(converter.makeHtml(html));
                        }
                    });
                })
            }
        })
    }
});

//initiate server
var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Server listening at http://%s:%s", host, port)
 })