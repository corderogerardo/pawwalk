# Keep kotlinx.serialization generated serializers.
-keepclassmembers,allowobfuscation class * { @kotlinx.serialization.SerialName <fields>; }
-keepclasseswithmembers,includedescriptorclasses class **$$serializer { *; }
