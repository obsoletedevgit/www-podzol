export default (req, res, next) => {
	if (!req.session.isAdmin) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	next();
};
