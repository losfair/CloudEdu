package ConfigurationManager

import (
    "golang.org/x/sys/windows/registry"
)

const DEFAULT_CONFIG_FILE_DIR = `C:\CloudEdu\`

func GetStringValue(itemName string) (string, error) {
    k, _, err := registry.CreateKey(registry.LOCAL_MACHINE, `SOFTWARE\CloudEdu`, registry.ALL_ACCESS)
    if err != nil {
        return "", err
    }
    v, _, err := k.GetStringValue(itemName)
    return v, err
}

func SetStringValue(itemName, itemValue string) error {
    k, _, err := registry.CreateKey(registry.LOCAL_MACHINE, `SOFTWARE\CloudEdu`, registry.ALL_ACCESS)
    if err != nil {
        return err
    }
    err = k.SetStringValue(itemName, itemValue)
    return err
}
