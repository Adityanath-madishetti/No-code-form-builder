import {
  createThemeService,
  listThemesService,
  updateThemeService,
  deleteThemeService,
} from "../services/themeTemplateService.js";

export const createTheme = async (req, res, next) => {
  try {
    const theme = await createThemeService(req.user.uid, req.body);
    res.status(201).json({ theme });
  } catch (err) {
    next(err);
  }
};

export const listThemes = async (req, res, next) => {
  try {
    const themes = await listThemesService(req.user);
    res.status(200).json({ themes });
  } catch (err) {
    next(err);
  }
};

export const updateTheme = async (req, res, next) => {
  try {
    const theme = await updateThemeService(
      req.params.themeId,
      req.user.uid,
      req.body,
    );
    res.status(200).json({ theme });
  } catch (err) {
    next(err);
  }
};

export const deleteTheme = async (req, res, next) => {
  try {
    await deleteThemeService(req.params.themeId, req.user.uid);
    res.status(200).json({ message: "Theme deleted" });
  } catch (err) {
    next(err);
  }
};
