using System;
using CommunityToolkit.Mvvm.ComponentModel;

namespace WpfExample.Models
{
    public partial class PlcTag : ObservableObject
    {
        [ObservableProperty]
        private string name = string.Empty;

        [ObservableProperty]
        private object? value;

        [ObservableProperty]
        private string dataType = string.Empty;

        [ObservableProperty]
        private DateTime lastUpdated;

        [ObservableProperty]
        private bool hasError;

        [ObservableProperty]
        private string? errorMessage;

        public PlcTag(string name, string dataType)
        {
            Name = name;
            DataType = dataType;
            LastUpdated = DateTime.Now;
        }

        public void UpdateValue(object newValue)
        {
            Value = newValue;
            LastUpdated = DateTime.Now;
            HasError = false;
            ErrorMessage = null;
        }

        public void SetError(string error)
        {
            HasError = true;
            ErrorMessage = error;
            LastUpdated = DateTime.Now;
        }
    }
}