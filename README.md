# WebGSN
A web-based tool for viewing and modifying assurance arguments in Goal-Structured-Notation (GSN), with capabilities to store as a local file or into a database

### Instruction of Installation - on local machine

#### To run this application, **Node.js**, **NPM** package manager are needed. 
(if you have already installed it, please go directly to STEP 2.)

1. Install Node.js & NPM. (on Terminal) ※Take Linux as example.
```
 $ sudo apt update 
 $ sudo apt install nodejs (Node.js) 
 $ sudo apt install npm
```
2. Clone the repository from  [https://github.com/safeautonomy/WebGSN](https://github.com/safeautonomy/WebGSN)
3. Use VScode to open the **WebGSN-main** folder. (When using VSCode, please also install **LiveServer** as an addon)
4. Create a new `.env` file in the **backend** folder.
5. Go to  [https://www.mongodb.com/](https://www.mongodb.com/) set up a database.
6. Paste the following text in `.env` file and don’t forget to save.
```
MONGO_URI = URI YOU GET FROM MONGODB
```
7. In VScode Open two terminal, you could achieve that by clicking ` ◫ ` .
8. On one terminal change the directory to **WebGSN-main/frontend** and install all dependencies.
```
npm i
```
9. On the other terminal change the directory to **WebGSN-main/backend** and install all dependencies.
```
npm i
```
And then to run the backend with the following command.
```
Npm run dev
```
10. Trigger the web server. (in VSCode, click on **“Go Live”** at the bottom right)

### How to use WebGSN - on browser

#### It's a template. Please edit the nodes and create a new safety case!

1. Right click to select an action. (add node, delete node…etc.)
2. `Delete node` delete a single node, `Delete Tree` is to delete all nodes below the node you’ve selected.
3. After the Delete, first scroll down and press `Update JSON` and then press `Create Safety Case` button to create your own safety case..
4. After the new treemodel is successfully added, You’d be asked to change the **Topic**, input field would show up, type in new topic and click `Change Topic`.
5. When you see the page reload back to the template, please search your safety case by typing the **Topic** in the search bar (on the top of the website). 
6. To add a new node outside of treemodel, by double clicking the background.
7. Hover to an existing node, ` + ` would show up, click to add a new node below. 
8. After pressing ` + `, you would be asked to define the type of the node, By changing **Type**, node would be shaped into different notation.
 The format is provided :  
 8.1. Goal (G)  → Rectangle
 8.2. Subgoal → Rectangle
 8.3. strategy (S) → Parallelogram
 8.4. Context (C) → Capsule
 8.5. Solution (Sn) → Circle
 8.6. Justification (J) → Ellipse
 8.7. Assumption (A) → Ellipse
9. By selecting a node to edit details.
10. Scroll down to **Details**, input field would show up for you to edit.
11. **Description** explain the task or the purpose of this node.
12. **Comments** is an optional input for more information, if it’s needed.
13. **linkDirection** decides which direction you wish the node to connect to its parent.
14. **Parent** references the id number of the node one above your current node.
15. `Update JSON` button is always needed to be clicked before `Create Safety Case` or `Save Changes`. 
16. To edit, please follow step 9. - 15. and then click `Save Changes` button, so you won't lose the changes.
17. Adjust where those nodes and the **Topic** should be located by Dragging it.
18. If you want to switch a node and its child nodes under another parent node, simply by dragging it to the parent node until the parent turns red and release. 
19. By clicking ` ▲ ` to collapse the diagram.
20. By clicking ` ▼ ` to expand the diagram.
21. Press `Zoom to Fit` or `Center on root`, to include the whole diagram in image before download.
22. Please click `Download Image` to download the image.
23. Please click `Download JSON` to download the JSON file.
