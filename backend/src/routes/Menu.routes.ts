import { Router } from "express";
import multer from "multer";
import { createMenu, deleteMenu, getMenuById, getMenus, updateMenu, getBestSeller } from "src/controllers/Menu.controllers.js";

const router = Router()

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
});

router.get('/bestsellers', getBestSeller)
router.get('/:menuId', getMenuById)
router.get('/', getMenus)
// router.post('/:menuId', createMenu)
// router.put('/:menuId', updateMenu)
router.post('/', upload.single('image'), createMenu)
router.put('/:menuId', upload.single('image'), updateMenu)
router.delete('/:id', deleteMenu)

export default router