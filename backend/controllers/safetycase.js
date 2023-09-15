const SafetyCase = require('../schemas/Safetycase');

const createSafetycase = async(req, res)=>{
    try{
        console.log(req.body); 
        const { topic, nodeDataArray } = req.body;
         // Find the existing topic by its name
         const existingTopic = await SafetyCase.findOne({ topic });
         if (!existingTopic) {
             // If the topic doesn't exist, create it with the new nodeDataArray
             const safetycase = await SafetyCase.create({
                 topic:"Change your topic",
                 nodeDataArray,
             });
             return res.status(201).json({ data: safetycase });
         }
         // If the topic exists, update its nodeDataArray with the new objects
         await existingTopic.save();
 
         res.status(201).json({ data: existingTopic });
     } catch (err) {
         res.status(500).json({ err });
     }
 };

const getAllSafetycase = async(req, res) =>{
try{
const safetycases = await SafetyCase.find();
!safetycases.length? res.status(200).json({msg:"No such SafetyCase in DB"}):
res.status(200).json({data:safetycases});
}catch(err){
res.status(500).json({err})
}
};

const getOneSafetycase = async(req, res)=>{
    try{
        console.log(req.params)
        const { id } = req.params;
        const safetycase = await SafetyCase.findById(id);
        safetycase? res.status(200).json({data:safetycase}):
        res.status(404).json({msg: 'No such safetyCase'})
    }catch(err){
        res.status(500).json({err})
    }
};
const getOneByTopic = async(req, res)=>{
    try{
        console.log(req.params)
        const { topic } = req.params;
        const safetycase = await SafetyCase.findOne({topic: topic});
        safetycase? res.status(200).json({data:safetycase}):
        res.status(404).json({msg: 'No such safetyCase'})
    }catch(err){
        res.status(500).json({err})
    }
};

const updateSafetycase = async(req, res)=>{
    try{
        const { topic } = req.params;
        const { newTopic, nodeDataArray } = req.body;
    const updatedSafetyCase = await SafetyCase.findOneAndUpdate(
        { topic: topic },
        { topic: newTopic, nodeDataArray }, { new: true });
        updatedSafetyCase? res.status(200).json({msg:'SafetyCase updated successfully', data: updatedSafetyCase}):
    res.status(404).json({msg: 'No such SafetyCase'})
    }catch(err){
        res.status(500).json({err})
}
};

const deleteOneSafetycase = async(req, res)=>{
    try{const { id } = req.params;
    const safetyCase  = await SafetyCase.findByIdAndDelete(id);
    safetyCase? res.status(200).json({msg:'SafetyCase deleted', data: safetyCase}):
    res.status(404).json({msg: 'No such SafetyCase'})
    }catch(err){
        res.status(500).json({err})
    }
};

const getLatestOne = async(req, res)=>{
    try{
    const latestOne = await SafetyCase.find().sort({_id:-1})
    latestOne? res.status(200).json({data: latestOne}):
    res.status(404).json({msg: 'No such SafetyCase'})
    }catch(err){
        res.status(500).json({err})
    }
};

const updateLatest = async(req, res)=>{
    try{
        const { topic } = req.params;
        const { newTopic, nodeDataArray } = req.body;
    const updatedSafetyCase = await SafetyCase.findOneAndUpdate(
        {topic: "Change your topic"},
        { topic: newTopic, nodeDataArray }, { new: true });
        updatedSafetyCase? res.status(200).json({msg:'SafetyCase updated successfully', data: updatedSafetyCase}):
    res.status(404).json({msg: 'No such SafetyCase'})
    }catch(err){
        res.status(500).json({err})
}
};


module.exports = {
    createSafetycase,
    getAllSafetycase,
    getOneSafetycase,
    getOneByTopic,
    updateSafetycase,
    deleteOneSafetycase,
    getLatestOne,
    updateLatest,
};