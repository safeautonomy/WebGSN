function init() {
    //fetch Data
    const getSafetyCase = async() => { 
        try{ 
        const res = await fetch(`http://localhost:5000/safetycases`);
        const data = await res.json();
        // header(data);
        load(data);
        document.getElementById("mySavedModel").value = JSON.stringify(data);
        myDiagram.add(
            $(go.Part, { location: new go.Point(500, -50) },
            $(go.Panel, "Table",
            $(go.TextBlock, "Topic: ", textStyle(),
            { font: "bold 24pt 'VT323', monospace", row: 0, column: 0, margin: 3 }),
            $(go.TextBlock, data.data[0].topic, { font: "bold 24pt 'VT323', monospace", stroke: "black", row: 0, column: 1, name: "topicTextBlock" }))));
            new go.Binding("text", data.data[0].topic ).makeTwoWay();
        } catch(error){
        console.log(error)
        }
    };
    getSafetyCase();

 
     
    const $ = go.GraphObject.make;  // for conciseness in defining templates

    myDiagram =
        new go.Diagram("myDiagramDiv", // must be the ID or reference to div
            {
                allowCopy: false,
                allowDelete: false,
                //initialAutoScale: go.Diagram.Uniform,
                maxSelectionCount: 1, // users can select only one part at a time
                validCycle: go.Diagram.CycleDestinationTree, // make sure users can only create trees
                "clickCreatingTool.archetypeNodeData": { // allow double-click in background to create a new node
                    type: "(new person)",
                    description: "",
                    comments: ""
                },
                "clickCreatingTool.insertPart": function (loc) {  // method override must be function, not =>
                    const node = go.ClickCreatingTool.prototype.insertPart.call(this, loc);
                    if (node !== null) {
                        this.diagram.select(node);
                        this.diagram.commandHandler.scrollToPart(node);
                        this.diagram.commandHandler.editTextBlock(node.findObject("TYPETB"));
                    }
                    return node;
                },
                layout:
                    $(go.TreeLayout,
                        {
                            treeStyle: go.TreeLayout.StyleLastParents,
                            arrangement: go.TreeLayout.ArrangementHorizontal,
                            // properties for most of the tree:
                            angle: 90,
                            layerSpacing: 35,
                            // properties for the "last parents":
                            alternateAngle: 90,
                            alternateLayerSpacing: 35,
                            alternateAlignment: go.TreeLayout.AlignmentBus,
                            alternateNodeSpacing: 20
                        }),
                "undoManager.isEnabled": true // enable undo & redo
            });

    // Create a data object for the diagram's topic
     const diagramData = {
        topic: "Your Topic Here", // Initial topic value
    };

    // Set up a binding between the topic and the TextBlock
    myDiagram.model = go.GraphObject.make(go.GraphLinksModel, {
        nodeDataArray: [], // Your node data array
        linkDataArray: [], // Your link data array
    });

    // Add the topic to the model
    myDiagram.model.addNodeData(diagramData);

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", e => {
        console.log("it's modified");
        const button = document.getElementById("SaveButton");
        if (button) button.disabled = !myDiagram.isModified;
        const idx = document.title.indexOf("*");
        if (myDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.slice(0, idx);
        }
    });

    const levelColors = ["#AC193D", "#2672EC", "#8C0095", "#5133AB",
        "#008299", "#D24726", "#008A00", "#094AB2"];

    // override TreeLayout.commitNodes to also modify the background brush based on the tree depth level
    myDiagram.layout.commitNodes = function () {  // method override must be function, not =>
        go.TreeLayout.prototype.commitNodes.call(this);  // do the standard behavior
        // then go through all of the vertexes and set their corresponding node's Shape.fill
        // to a brush dependent on the TreeVertex.level value
        myDiagram.layout.network.vertexes.each(v => {
            if (v.node) {
                const level = v.level % (levelColors.length);
                const color = levelColors[level];
                const shape = v.node.findObject("SHAPE");
                if (shape) shape.stroke = $(go.Brush, "Linear", { 0: color, 1: go.Brush.lightenBy(color, 0.05), start: go.Spot.Left, end: go.Spot.Right });
            }
        });
    };

    // this is used to determine feedback during drags
    function mayWorkFor(node1, node2) {
        if (!(node1 instanceof go.Node)) return false;  // must be a Node
        if (node1 === node2) return false;  // cannot work for yourself
        if (node2.isInTreeOf(node1)) return false;  // cannot work for someone who works for you
        return true;
    }

    // This function provides a common style for most of the TextBlocks.
    // Some of these values may be overridden in a particular TextBlock.
    function textStyle() {
        return { font: "14pt  'VT323', monospace", stroke: "black", spacingAbove: 3, spacingBelow: 3 };
    }

    // This converter is used by the Picture.
    function findHeadShot(pic) {
        if (!pic) return "images/HSnopic.png"; // There are only 16 images on the server
        return pic;
    }

    // define the Node template
    myDiagram.nodeTemplate =
    $(go.Node, "Spot",
        {   
            selectionObjectName: "BODY",
            mouseEnter: (e, node) => node.findObject("BUTTON").opacity = node.findObject("BUTTONX").opacity = 1,
            mouseLeave: (e, node) => node.findObject("BUTTON").opacity = node.findObject("BUTTONX").opacity = 0,
            // handle dragging a Node onto a Node to (maybe) change the reporting relationship
            mouseDragEnter: (e, node, prev) => {
                const diagram = node.diagram;
                const selnode = diagram.selection.first();
                if (!mayWorkFor(selnode, node)) return;
                const shape = node.findObject("SHAPE");
                if (shape) {
                    shape._prevFill = shape.fill;  // remember the original brush
                    shape.fill = "darkred";
                }
            },
            mouseDragLeave: (e, node, next) => {
                const shape = node.findObject("SHAPE");
                if (shape && shape._prevFill) {
                    shape.fill = shape._prevFill;  // restore the original brush
                }
            },
            mouseDrop: (e, node) => {
                const diagram = node.diagram;
                const selnode = diagram.selection.first();  // assume just one Node in selection
                if (mayWorkFor(selnode, node)) {
                    // find any existing link into the selected node
                    const link = selnode.findTreeParentLink();
                    if (link !== null) {  // reconnect any existing link
                        link.fromNode = node;
                    } else {  // else create a new link
                        diagram.toolManager.linkingTool.insertLink(node, node.port, selnode, selnode.port);
                    }
                }
            }
        },
        // for sorting, have the Node.text be the data.name
        new go.Binding("text", "type"),
        // bind the Part.layerName to control the Node's layer depending on whether it isSelected
        new go.Binding("layerName", "isSelected", sel => sel ? "Foreground" : "").ofObject(),
        $(go.Panel, "Auto",
            { name: "BODY" },
            // define the node's outer shape
            $(go.Shape, "RoundedRectangle",
                { name: "SHAPE", fill: "#ffffff", stroke: 'white', strokeWidth: 5, portId: "", height: 200 },
                // fullfill change color
                new go.Binding("fill", "fullfill", function(fullfill) {
                    return fullfill ? "lightgray" : "white";
                })
                ),  
            $(go.Panel, "Horizontal",
                $(go.Picture,
                    {
                        name: "Picture",
                        desiredSize: new go.Size(70, 70),
                        margin: 1.5,
                        source: "images/HSnopic.png",  // the default image
                    },
                    new go.Binding("source", "pic", findHeadShot)),
                // define the panel where the text will appear
                $(go.Panel, "Table",
                    {
                        minSize: new go.Size(130, NaN),
                        maxSize: new go.Size(200, NaN),
                        margin: new go.Margin(6, 10, 0, 6),
                        defaultAlignment: go.Spot.Left,
                    },
                    $(go.RowColumnDefinition, { column: 2, width: 4}),
                    $(go.TextBlock, "Type: ", textStyle(),
                    { row: 0, column: 0, margin: 3 }),
                    $(go.TextBlock, textStyle(),  // the name
                        {
                            name: "TYPETB",
                            row: 0, column: 1, columnSpan: 1,
                            font: "18pt 'VT323', monospace",
                            editable: true, isMultiline: false,
                            minSize: new go.Size(50, 16),
                            margin:(0, 0, 5, 0),
                        },
                        new go.Binding("text", "type").makeTwoWay()),
                    $(go.TextBlock, "Description: ", textStyle(),
                        { row: 3, column: 0, margin: 3 }),
                    $(go.TextBlock, textStyle(),
                        {
                            row: 4, column: 0, columnSpan: 4,
                            editable: true, isMultiline: false,
                            minSize: new go.Size(50, 14),
                            margin: new go.Margin(0, 0, 0, 3)
                        },
                        new go.Binding("text", "description").makeTwoWay()),
                    $(go.TextBlock, textStyle(),
                        { row: 1, column: 0, margin: 3 },
                        new go.Binding("text", "key", v => "Hierarchy: " + v)),
                    $(go.TextBlock, textStyle(),
                        { row: 2, column: 0, margin: 3 },
                        new go.Binding("text", "fullfill", f => "Fullfill: " + f)),
                    $(go.TextBlock, textStyle(),  // the comments
                        {
                            row: 4, column: 0, columnSpan: 5,
                            font: "12pt 'VT323', monospace",
                            wrap: go.TextBlock.WrapFit,
                            editable: true,  // by default newlines are allowed
                            minSize: new go.Size(100, 14),
                        },
                        new go.Binding("text", "comments").makeTwoWay())
                ) // end Table Panel
            ) // end Horizontal Panel
        ), // end Auto Panel
        $("Button",
            $(go.Shape, "PlusLine", { width: 10, height: 10 }),
            {
                name: "BUTTON", alignment: go.Spot.Right, opacity: 0,  // initially not visible
                click: (e, button) => addEmployee(button.part)
            },
            // button is visible either when node is selected or on mouse-over
            new go.Binding("opacity", "isSelected", s => s ? 1 : 0).ofObject()
        ),
        new go.Binding("isTreeExpanded").makeTwoWay(),
        $("TreeExpanderButton",
            {
                name: "BUTTONX", alignment: go.Spot.Bottom, opacity: 0,  // initially not visible
                "_treeExpandedFigure": "TriangleUp",
                "_treeCollapsedFigure": "TriangleDown"
            },
            // button is visible either when node is selected or on mouse-over
            new go.Binding("opacity", "isSelected", s => s ? 1 : 0).ofObject()
        )
    );  // end Node, a Spot Panel

    function addEmployee(node) {
        if (!node) return;
        const thisemp = node.data;
        myDiagram.startTransaction("Add Task");
        const newemp = { type: "(new person)", comments: "", parent: thisemp.key };
        myDiagram.model.addNodeData(newemp);
        const newnode = myDiagram.findNodeForData(newemp);
        if (newnode) newnode.location = node.location;
        myDiagram.commitTransaction("Add Task");
        myDiagram.commandHandler.scrollToPart(newnode);
    }

    // the context menu allows users to make a position vacant,
    // remove a role and reassign the subtree, or remove a department
    myDiagram.nodeTemplate.contextMenu =
        $("ContextMenu",
            $("ContextMenuButton",
                $(go.TextBlock, "Add Task"),
                {
                    click: (e, button) => addEmployee(button.part.adornedPart)
                }
            ),
            $("ContextMenuButton",
                $(go.TextBlock, "Vacate Task"),
                {
                    click: (e, button) => {
                        const node = button.part.adornedPart;
                        if (node !== null) {
                            const thisemp = node.data;
                            myDiagram.startTransaction("vacate");
                            // update the key, name, picture, and comments, but leave the title
                            myDiagram.model.setDataProperty(thisemp, "type", "(Vacant)");
                            myDiagram.model.setDataProperty(thisemp, "pic", "");
                            myDiagram.model.setDataProperty(thisemp, "comments", ""); 
                            myDiagram.commitTransaction("vacate");
                        }
                    }
                }
            ),
            $("ContextMenuButton",
                $(go.TextBlock, "Remove Task"),
                {
                    click: (e, button) => {
                        // reparent the subtree to this node's boss, then remove the node
                        const node = button.part.adornedPart;
                        if (node !== null) {
                            myDiagram.startTransaction("reparent remove");
                            const chl = node.findTreeChildrenNodes();
                            // iterate through the children and set their parent key to our selected node's parent key
                            while (chl.next()) {
                                const emp = chl.value;
                                myDiagram.model.setParentKeyForNodeData(emp.data, node.findTreeParentNode().data.key);
                            }
                            // and now remove the selected node itself
                            myDiagram.model.removeNodeData(node.data);
                            myDiagram.commitTransaction("reparent remove");
                        }
                    }
                }
            ),
            $("ContextMenuButton",
                $(go.TextBlock, "Remove Tree"),
                {
                    click: (e, button) => {
                        // remove the whole subtree, including the node itself
                        const node = button.part.adornedPart;
                        if (node !== null) {
                            myDiagram.startTransaction("remove dept");
                            myDiagram.removeParts(node.findTreeParts());
                            myDiagram.commitTransaction("remove dept");
                        }
                    }
                }
            )
        );

    // define the Link template
    myDiagram.linkTemplate =
        $(go.Link, go.Link.Orthogonal,
            {
                layerName: "Background",
                routing: go.Link.AvoidsNodes,
                corner: 10,  
                toShortLength: 7,
            },
            
            $(go.Shape, 
            { 
                strokeWidth: 5,
            }),
            $(go.Shape, { 
                toArrow: "Standard",
                fill: "yellow",
                strokeWidth: 3, 
                stroke: "black" }));  // the link shape

    // support editing the properties of the selected person in HTML
    if (window.Inspector) myInspector = new Inspector("myInspector", myDiagram,
    {
        properties: {
        "_id": { readOnly: true, show: false },
        "key": { readOnly: true },
        "type": {}, 
        "description": {}, 
        "comments": {},
        "fullfill": { type: "select", choices: ["true", "false"] }
    }}
    );

  
    // Setup zoom to fit button
    document.getElementById('zoomToFit').addEventListener('click', () => myDiagram.commandHandler.zoomToFit());

    document.getElementById('centerRoot').addEventListener('click', () => {
        myDiagram.scale = 1;
        myDiagram.commandHandler.scrollToPart(myDiagram.findNodeForKey(1));
        
    });

    // get modified JSON
    const modifiedJSON = document.getElementById("mySavedModel").value;
    // Add an event listener to the "Update Data" button
    const updateDataButton = document.getElementById("updateDataButton");
    updateDataButton.addEventListener("click", () => {
    const modifiedJSON = document.getElementById("mySavedModel").value;
    updateDatabase(modifiedJSON);
    });

    // Enable the button when you have modifiedJSON
    function enableUpdateButton() {
    const updateDataButton = document.getElementById("updateDataButton");
    updateDataButton.removeAttribute("disabled");
    };
    function disableUpdateButton() {
    const updateDataButton = document.getElementById("updateDataButton");
    updateDataButton.setAttribute("disabled", "true");
    };
    document.getElementById('SaveButton').addEventListener('click', () => enableUpdateButton());
    document.getElementById('updateDataButton').addEventListener('click', () => disableUpdateButton());
    // update topic
    document.getElementById('updateTopic').addEventListener('click', () =>{
        const topicInput = document.getElementById('topicInput').value;
        updateTopic(topicInput);
    });
    document.getElementById('topicInput').addEventListener('input', function () {
        const topicInputValue = document.getElementById('topicInput').value;
        const updateTopicButton = document.getElementById('updateTopic');
        // Check if the input value is not empty and enable/disable the button accordingly
        if (topicInputValue !== '') {
            updateTopicButton.removeAttribute('disabled');
        } else {
            updateTopicButton.setAttribute('disabled', 'true');
        }
    });
    // save as image
    document.getElementById("blobButton").addEventListener("click", makeBlob);

    // save as JSON
    document.getElementById("downloadJsonButton").addEventListener("click", downloadJson);
   
} // end init

function save() {
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
};

function load(data) {
    // myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
    if (data && data.data[0].nodeDataArray) {
        const modelData = data.data[0].nodeDataArray;
        const treeModel = go.GraphObject.make(go.TreeModel);
        treeModel.nodeDataArray = modelData;
        myDiagram.model = treeModel;
        console.log("Data loaded:", modelData);
        // make sure new data keys are unique positive integers
        let lastkey = 1;
        myDiagram.model.makeUniqueKeyFunction = (model, modelData) => {
            let k = modelData.key || lastkey;
            while (model.findNodeDataForKey(k)) k++;
            modelData.key = lastkey = k;
            return k;
        };
    } else {
        console.error("Data is missing or invalid.");
    }
};

// update from edit
async function updateDatabase(modifiedJSON) {
    const modifiedData = JSON.parse(modifiedJSON);
    delete modifiedData.class;
    const finalModifiedJson = JSON.stringify(modifiedData);
    console.log(finalModifiedJson);
    try {
        const response = await fetch('http://localhost:5000/safetycases/64e49de0884ff8008dcfc289', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: finalModifiedJson,
        });

        if (response.ok) {
            console.log('Data updated successfully.');
        } else {
            console.error('Failed to update data.');
        }
    } catch (error) {
        console.error('Error updating data:', error);
    }
};

// save image
function myCallback(blob) {
    let url = window.URL.createObjectURL(blob);
    let filename = "myBlobFile.png";
    let a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;
    // IE 11
    if (window.navigator.msSaveBlob !== undefined) {
      window.navigator.msSaveBlob(blob, filename);
      return;
    }
    document.body.appendChild(a);
    requestAnimationFrame(() => {
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }
  function makeBlob() {
    var blob = myDiagram.makeImageData({ background: "white", returnType: "blob", callback: myCallback });
  };

  //save JSON
  function downloadJson() {
    // Get the JSON data from the mySavedModel textarea
    const jsonData = document.getElementById("mySavedModel").value;

    // Create a Blob with the JSON data
    const blob = new Blob([jsonData], { type: "application/json" });

    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mySavedModel.json";

    // Trigger the click event on the link to start the download
    a.click();

    // Clean up by revoking the object URL
    URL.revokeObjectURL(a.href);
};

  // update topic
  async function updateTopic(newTopic) {
    try {
        // Define the data to be sent in the request body
        const data = { topic: newTopic };
        const response = await fetch('http://localhost:5000/safetycases/64e49de0884ff8008dcfc289', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            console.log('Topic updated successfully in the database.');
            location.reload();
        } else {
            console.error('Failed to update the topic in the database.');
        };
    } catch (error) {
        console.error('Error updating the topic in the database:', error);
    };
};


window.addEventListener('DOMContentLoaded', init);

