package main

import (
    "fmt"
    "TemplateRenderer"
)

func main() {
    doc := TemplateRenderer.LoadDocumentFromFile("test.omt")
    fmt.Println(doc.RenderToHtml(true))
    fmt.Println(doc.GenerateJavascriptRenderer(true))
}
