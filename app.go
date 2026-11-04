package main

import (
	"context"
	"errors"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) ChoosePDMFile() (*PDMModel, error) {
	path, err := runtime.OpenFileDialog(a.ctx, pdmOpenDialogOptions("选择 PowerDesigner PDM 文件"))
	if err != nil {
		return nil, err
	}
	if path == "" {
		return nil, errors.New("已取消选择文件")
	}
	return ParsePDM(path)
}

func (a *App) ChoosePDMFiles() ([]*PDMModel, error) {
	paths, err := runtime.OpenMultipleFilesDialog(a.ctx, pdmOpenDialogOptions("选择一个或多个 PowerDesigner PDM 文件"))
	if err != nil {
		return nil, err
	}
	if len(paths) == 0 {
		return nil, errors.New("已取消选择文件")
	}

	models := make([]*PDMModel, 0, len(paths))
	for _, path := range paths {
		model, err := ParsePDM(path)
		if err != nil {
			return models, err
		}
		models = append(models, model)
	}
	return models, nil
}

func (a *App) ParsePDMFile(path string) (*PDMModel, error) {
	return ParsePDM(path)
}

func pdmOpenDialogOptions(title string) runtime.OpenDialogOptions {
	return runtime.OpenDialogOptions{
		Title: title,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "PowerDesigner PDM Files (*.pdm)",
				Pattern:     "*.pdm",
			},
			{
				DisplayName: "XML Files (*.xml)",
				Pattern:     "*.xml",
			},
		},
	}
}
