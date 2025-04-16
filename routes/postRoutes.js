const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const { validatePost } = require('../middlewares/validationMiddleware');

 router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

router.use(authController.protect);

router.post('/', authController.restrictTo('admin', 'editor', 'author'), validatePost, postController.createPost);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);

//  router.get('/:postId/comments', postController.getPostComments);
//  router.post('/:postId/comments', postController.addComment);

module.exports = router;