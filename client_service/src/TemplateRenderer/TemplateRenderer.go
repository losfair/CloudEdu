package TemplateRenderer

import (
    "unsafe"
    "io/ioutil"
)

/*
#cgo LDFLAGS: -L. -lOxygenMark
void * loadDocument(const char *filename);
void * loadDocumentFromSource(const char *src_c);
void destroyDocument(void *doc);
void setDocumentParam(void *doc, const char *key, const char *value);
void clearDocumentParams(void *doc);
char * renderToHtml(void *doc, unsigned char isWholePage);
char * generateJavascriptRenderer(void *doc, unsigned char isWholePage);
void free(char *ptr);
*/
import "C"

type Document struct {
    resource unsafe.Pointer
}

func LoadDocumentFromSource(src []byte) *Document {
    if src == nil || len(src) == 0 {
        return nil
    }
    ret := new(Document)
    buf := make([]byte, len(src) + 1)
    copy(buf, src)
    buf[len(src)] = 0
    ret.resource = C.loadDocumentFromSource((*C.char)(unsafe.Pointer(&buf[0])))
    return ret
}

func LoadDocumentFromFile(fileName string) *Document {
    data, err := ioutil.ReadFile(fileName)
    if err != nil {
        return nil
    }
    return LoadDocumentFromSource(data)
}


func (d *Document) Destroy() {
    if d.resource == nil {
        return
    }
    C.destroyDocument(d.resource)
    d.resource = nil
}

func (d *Document) SetParam(key, value string) {
    if d.resource == nil {
        return
    }
    keyBuf := C.CString(key)
    valueBuf := C.CString(value)

    C.setDocumentParam(d.resource, keyBuf, valueBuf)

    C.free(keyBuf)
    C.free(valueBuf)
}

func (d *Document) ClearParams() {
    if d.resource == nil {
        return
    }
    C.clearDocumentParams(d.resource)
}

func (d *Document) RenderToHtml(isWholePage bool) string {
    if d.resource == nil {
        return ""
    }
    isWholePageParam := byte(0)
    if isWholePage {
        isWholePageParam = byte(1)
    }
    result := C.renderToHtml(d.resource, C.uchar(isWholePageParam))
    ret := C.GoString(result)
    C.free(result)
    return ret
}

func (d *Document) GenerateJavascriptRenderer(isWholePage bool) string {
    if d.resource == nil {
        return ""
    }
    isWholePageParam := byte(0)
    if isWholePage {
        isWholePageParam = byte(1)
    }
    result := C.generateJavascriptRenderer(d.resource, C.uchar(isWholePageParam))
    ret := C.GoString(result)
    C.free(result)
    return ret
}
